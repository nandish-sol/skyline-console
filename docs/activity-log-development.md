# Activity Log Development Guide

## Overview

Enterprise-grade activity monitoring for OpenStack via Skyline Console, powered by OpenSearch.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES (2 pipelines)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pipeline 1: LOG-BASED (working now)                             │
│  ─────────────────────────────────                               │
│  OpenStack Services write log files                              │
│       ↓                                                          │
│  /var/log/kolla/{nova,cinder,neutron,keystone,...}/*.log          │
│       ↓                                                          │
│  Fluentd (on each node)                                          │
│    ├─ Parses: user_id, tenant_id, request_id, http fields        │
│    ├─ Filters: ONLY POST/PUT/DELETE/PATCH                        │
│    ├─ Enriches: service, action_type, resource_type, resource_id │
│    └─ Writes to: OpenSearch (openstack-audit-YYYY.MM.DD)         │
│                                                                  │
│  Limitation: Cannot see action NAME for POST /servers/{id}/action│
│  (delete vs stop vs reboot — all look the same in logs)          │
│                                                                  │
│  Pipeline 2: NOTIFICATION-BASED (needs consumer)                 │
│  ───────────────────────────────────────────                     │
│  OpenStack Services emit oslo.messaging notifications            │
│       ↓                                                          │
│  RabbitMQ (notifications.info queue — quorum queue)              │
│       ↓                                                          │
│  xloud-audit-consumer (Python service — TO BE BUILT)             │
│    ├─ Reads: instance.delete.end, volume.create.start, etc.      │
│    ├─ Enriches: user_name, project_name (Keystone cache)         │
│    └─ Writes to: OpenSearch (openstack-audit-YYYY.MM.DD)         │
│                                                                  │
│  Gives: Real action names, resource names, full context          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        STORAGE                                   │
│  OpenSearch (3-node cluster, port 9200)                          │
│  Index: openstack-audit-YYYY.MM.DD                               │
│  Retention: 90 days (ISM policy auto-delete)                     │
│  Dashboard: http://103.240.25.201:5601                           │
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                 │
│  Skyline APIServer (FastAPI)                                     │
│  Endpoint: GET /api/v1/extension/activity-log                    │
│  File: skyline_apiserver/api/v1/activity_log.py                  │
│  Queries OpenSearch with server-side filtering                   │
│  Returns: activities[], total, aggregations{}                    │
├─────────────────────────────────────────────────────────────────┤
│                        FRONTEND                                  │
│  Skyline Console (React)                                         │
│  Page: src/pages/management/containers/ActivityLog/index.jsx     │
│  Route: /monitor-center/activity-log-admin                       │
│  Features: Filter dropdowns, pagination, summary cards           │
└─────────────────────────────────────────────────────────────────┘
```

## What Was Done

### 1. OpenSearch Index Template + ISM Policy
```bash
# Created on 2026-03-30
curl -X PUT 'http://10.0.1.71:9200/_index_template/openstack-audit-template' ...
curl -X PUT 'http://10.0.1.71:9200/_plugins/_ism/policies/openstack-audit-policy' ...
```
- Index pattern: `openstack-audit-*`
- 46 fields mapped (service, action_type, resource_type, http_*, user_id, etc.)
- 90-day auto-delete retention

### 2. Fluentd Log-Based Pipeline
- Added OpenSearch output to `/etc/xavs/fluentd/fluentd.conf` on all 3 nodes (XD1, XD2, XD5)
- Filters: Only POST/PUT/DELETE/PATCH requests
- Excludes: auth/tokens, OPTIONS, healthchecks
- Enriches: service name, action_type, resource_type, resource_id, node
- Output: `openstack-audit-*` index in OpenSearch

### 3. Notification Driver Enabled
- Changed `driver = noop` to `driver = messagingv2` in:
  - Nova (all containers: api, compute, conductor, scheduler)
  - Cinder (api, scheduler, volume)
  - Neutron (server, dhcp-agent, l3-agent, openvswitch-agent)
  - Glance (api)
- Config files at `/etc/xavs/{service}-{role}/{service}.conf` on each node
- Keystone already had `driver = messagingv2`
- RabbitMQ `notifications.info` queue receives events

### 4. Skyline APIServer Rewrite
- File: `skyline_apiserver/api/v1/activity_log.py`
- Replaced Nova-only instance-actions polling with OpenSearch queries
- Server-side filtering: service, action_type, resource_type, user_id, project_id, date range, search
- Aggregations for filter dropdowns
- Offset/limit pagination
- RBAC: non-admin users scoped to their project
- Response time normalization (microseconds → seconds)

### 5. Skyline Console Frontend
- File: `src/pages/management/containers/ActivityLog/index.jsx`
- Summary cards: Total Events, Success (2xx), Client Error (4xx), Server Error (5xx)
- Filter dropdowns: Service, Action, Resource Type (populated from /services endpoint)
- Date range picker, full-text search
- Paginated table: 20/50/100/200 per page
- Color-coded tags for actions and HTTP status

### 6. OpenSearch Dashboards
- Deployed standalone OpenSearch Dashboards at http://103.240.25.201:5601
- Security plugin removed (internal network, no auth needed)
- Index pattern `openstack-audit-*` created with `@timestamp` time field
- Accessible for direct data exploration and visualization

## What's Still Needed

### Priority 1: Build xloud-audit-consumer
- Python service using `oslo.messaging.get_notification_listener()`
- Consumes from RabbitMQ `notifications.info` queue (quorum queue)
- Parses `event_type` for action name (instance.delete.end, volume.create.start, etc.)
- Extracts resource details from payload (display_name, instance_id, etc.)
- Caches user_name/project_name from Keystone
- Bulk writes to OpenSearch `openstack-audit-*` index
- Deploy as Docker container via xavs-ansible

Why not Fluentd: `fluent-plugin-amqp` doesn't support quorum queues (RabbitMQ HA)

### Priority 2: User/Project Name Resolution
- Activity Log currently shows user_id (UUID), not username
- APIServer should resolve user_id → username via Keystone cache
- Same for project_id → project_name

### Priority 3: Frontend Filter Fix
- Activity Log filters send correct params but table data may not update visually
- Need to verify Axios params passing works correctly with Skyline's request interceptor

### Priority 4: Ship via xavs-ansible
- Fluentd config changes → `/etc/xavs/fluentd/` templates in xavs-ansible
- Notification driver changes → per-service config overrides in xavs-ansible
- OpenSearch Dashboards → deploy via xavs-ansible role
- xloud-audit-consumer → new Docker container + ansible role

## Key Files

| File | Purpose |
|------|---------|
| `skyline_apiserver/api/v1/activity_log.py` | Backend API endpoint |
| `src/pages/management/containers/ActivityLog/index.jsx` | Frontend React page |
| `/etc/xavs/fluentd/fluentd.conf` | Fluentd pipeline config (per node) |
| `/etc/xavs/{service}-{role}/{service}.conf` | Service notification config (per node) |
| `/etc/xavs/opensearch-dashboards/opensearch_dashboards.yml` | OpenSearch Dashboards config |

## Notification Event Types

When `driver = messagingv2` is enabled, services emit:

| Service | Event Types |
|---------|-------------|
| Nova | `instance.create.start/end`, `instance.delete.start/end`, `instance.power_off/on.start/end`, `instance.reboot.start/end`, `instance.resize.start/end`, `instance.suspend/resume`, `instance.shelve/unshelve`, `instance.live_migration`, `instance.snapshot` |
| Cinder | `volume.create.start/end`, `volume.delete.start/end`, `volume.attach/detach.start/end`, `snapshot.create/delete.start/end` |
| Neutron | `network.create/update/delete.end`, `subnet.create/update/delete.end`, `port.create/update/delete.end`, `router.create/update/delete.end`, `floatingip.create/update/delete.end`, `security_group.create/delete.end` |
| Glance | `image.create`, `image.update`, `image.delete`, `image.upload`, `image.activate` |
| Keystone | `identity.user.created/updated/deleted`, `identity.project.created/updated/deleted`, `identity.role_assignment.created/deleted`, `identity.authenticate` |

## Credentials

- OpenSearch: `http://10.0.1.71:9200` (no auth, security plugin disabled)
- RabbitMQ: `openstack:pMzjEbtWbzhWjxWsEHOnZjhc63QPJw2irJPoCK4i` on ports 5672
- OpenSearch Dashboards: `http://103.240.25.201:5601` (no auth)
