// Copyright 2025-2026 Xloud Technologies Pvt Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Input, Spin, Tag } from 'antd';
import {
  SearchOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  CloudOutlined,
  PictureOutlined,
  SafetyOutlined,
  BranchesOutlined,
  GlobalOutlined,
  KeyOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  RightOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import styles from './index.less';

const DEBOUNCE_MS = 300;
const MAX_RECENT = 5;
const RECENT_KEY = 'xloud_recent_searches';

const QUICK_ACTIONS = [
  {
    label: 'Launch Instance',
    icon: <DesktopOutlined />,
    url: '/compute/instance/create',
  },
  {
    label: 'Create Volume',
    icon: <DatabaseOutlined />,
    url: '/storage/volume/create',
  },
  {
    label: 'Create Network',
    icon: <CloudOutlined />,
    url: '/network/networks/create',
  },
  {
    label: 'Manage Flavors',
    icon: <AppstoreOutlined />,
    url: '/compute/flavor-admin',
  },
  {
    label: 'Manage Images',
    icon: <PictureOutlined />,
    url: '/compute/image',
  },
  {
    label: 'Key Pairs',
    icon: <KeyOutlined />,
    url: '/compute/keypair',
  },
  {
    label: 'Security Groups',
    icon: <SafetyOutlined />,
    url: '/network/security-group',
  },
  {
    label: 'XAVS Health',
    icon: <HeartOutlined />,
    url: '/ha/xavs-health-admin',
  },
];

const TYPE_ICONS = {
  instance: <DesktopOutlined />,
  volume: <DatabaseOutlined />,
  network: <CloudOutlined />,
  image: <PictureOutlined />,
  security_group: <SafetyOutlined />,
  router: <BranchesOutlined />,
  floating_ip: <GlobalOutlined />,
  keypair: <KeyOutlined />,
  flavor: <AppstoreOutlined />,
  project: <TeamOutlined />,
  user: <UserOutlined />,
};

const TYPE_LABELS = {
  instance: 'Instances',
  volume: 'Volumes',
  network: 'Networks',
  image: 'Images',
  security_group: 'Security Groups',
  router: 'Routers',
  floating_ip: 'Floating IPs',
  keypair: 'Key Pairs',
  flavor: 'Flavors',
  project: 'Projects',
  user: 'Users',
};

const TYPE_ORDER = [
  'instance',
  'volume',
  'network',
  'image',
  'security_group',
  'router',
  'floating_ip',
  'keypair',
  'flavor',
  'project',
  'user',
];

function getStatusColor(status) {
  if (!status) return '';
  const s = status.toLowerCase();
  if (
    s === 'active' ||
    s === 'available' ||
    s === 'in-use' ||
    s === 'enabled'
  ) {
    return 'success';
  }
  if (s === 'error') {
    return 'error';
  }
  if (s === 'shutoff' || s === 'down' || s === 'disabled') {
    return 'default';
  }
  return 'warning';
}

function fuzzyMatch(str, query) {
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  if (s.indexOf(q) >= 0) return true;
  let qi = 0;
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveRecent(item) {
  let recent = getRecent().filter((r) => r.url !== item.url);
  recent.unshift({
    name: item.name,
    url: item.url,
    type: item.type,
  });
  if (recent.length > MAX_RECENT) {
    recent = recent.slice(0, MAX_RECENT);
  }
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch (e) {
    // localStorage may be full or disabled
  }
}

export class GlobalSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      query: '',
      results: [],
      loading: false,
      selectedIndex: -1,
      noResults: false,
    };
    this.debounceTimer = null;
    this.inputRef = React.createRef();
    this.resultsRef = React.createRef();
    this.itemRefs = [];
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleGlobalKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // Sync with parent visible prop when provided
    if (
      nextProps.visible !== undefined &&
      nextProps.visible !== prevState.parentVisible
    ) {
      return { visible: nextProps.visible, parentVisible: nextProps.visible };
    }
    return null;
  }

  handleGlobalKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      this.setState(
        (prev) => {
          if (prev.visible) {
            const { onClose } = this.props;
            if (onClose) setTimeout(onClose, 0);
            return {
              visible: false,
              query: '',
              results: [],
              selectedIndex: -1,
              noResults: false,
            };
          }
          return { visible: true };
        },
        () => {
          if (this.state.visible && this.inputRef.current) {
            this.inputRef.current.focus();
          }
        }
      );
      return;
    }

    if (!this.state.visible) return;

    if (e.key === 'Escape') {
      this.close();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.navigate(1);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigate(-1);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this.selectCurrent();
    }
  };

  // eslint-disable-next-line react/sort-comp
  close = () => {
    this.setState({
      visible: false,
      query: '',
      results: [],
      selectedIndex: -1,
      loading: false,
      noResults: false,
    });
    const { onClose } = this.props;
    if (onClose) onClose();
  };

  getAllVisibleItems() {
    // Build flat list of all items visible in the results pane
    const { query, results } = this.state;
    const items = [];

    if (!query) {
      // Show recent + quick actions
      const recent = getRecent();
      recent.forEach((r) => {
        items.push({ url: r.url, name: r.name, type: r.type });
      });
      QUICK_ACTIONS.forEach((a) => {
        items.push({ url: a.url, name: a.label, type: 'quick_action' });
      });
    } else if (query.length < 2) {
      // Filtered quick actions only
      const matched = QUICK_ACTIONS.filter((a) => fuzzyMatch(a.label, query));
      matched.forEach((a) => {
        items.push({ url: a.url, name: a.label, type: 'quick_action' });
      });
    } else {
      // Search results grouped by type + filtered quick actions
      const grouped = {};
      results.forEach((item) => {
        if (!grouped[item.type]) grouped[item.type] = [];
        grouped[item.type].push(item);
      });
      TYPE_ORDER.forEach((type) => {
        if (!grouped[type]) return;
        grouped[type].forEach((item) => {
          items.push(item);
        });
      });
      const matched = QUICK_ACTIONS.filter((a) => fuzzyMatch(a.label, query));
      matched.forEach((a) => {
        items.push({ url: a.url, name: a.label, type: 'quick_action' });
      });
    }

    return items;
  }

  navigate(direction) {
    const items = this.getAllVisibleItems();
    if (items.length === 0) return;

    this.setState(
      (prev) => {
        let idx = prev.selectedIndex + direction;
        if (idx < 0) idx = items.length - 1;
        if (idx >= items.length) idx = 0;
        return { selectedIndex: idx };
      },
      () => {
        // Scroll the active item into view
        const el = this.itemRefs[this.state.selectedIndex];
        if (el) {
          el.scrollIntoView({ block: 'nearest' });
        }
      }
    );
  }

  selectCurrent() {
    const items = this.getAllVisibleItems();
    const { selectedIndex } = this.state;
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      const item = items[selectedIndex];
      this.navigateTo(item);
    }
  }

  navigateTo = (item) => {
    if (item.type !== 'quick_action') {
      saveRecent(item);
    }
    this.close();
    // Use the global navigateTo from MobX RouterStore (set in stores/root.js)
    if (global.navigateTo) {
      global.navigateTo(item.url);
    } else {
      window.location.href = item.url;
    }
  };

  handleInputChange = (e) => {
    const query = e.target.value;
    this.setState({ query, selectedIndex: -1, noResults: false });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (query.trim().length < 2) {
      this.setState({ results: [], loading: false, noResults: false });
      return;
    }

    this.setState({ loading: true });
    this.debounceTimer = setTimeout(() => {
      this.doSearch(query.trim());
    }, DEBOUNCE_MS);
  };

  doSearch = async (query) => {
    try {
      const { default: client } = await import('client/skyline');
      const data = await client.request.get(`extension/xloud-search`, {
        q: query,
      });
      if (this.state.query.trim() === query) {
        const results = data.results || [];
        this.setState({
          results,
          loading: false,
          noResults: results.length === 0,
        });
      }
    } catch (e) {
      if (this.state.query.trim() === query) {
        this.setState({ results: [], loading: false, noResults: true });
      }
    }
  };

  handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      this.close();
    }
  };

  renderStatusTag(status) {
    if (!status) return null;
    const color = getStatusColor(status);
    return (
      <Tag color={color} className={styles['status-tag']}>
        {status}
      </Tag>
    );
  }

  renderRecentItems(startIndex) {
    const recent = getRecent();
    if (recent.length === 0) return null;
    const { selectedIndex } = this.state;

    return (
      <div className={styles['search-group']}>
        <div className={styles['group-label']}>
          <ClockCircleOutlined /> Recent
        </div>
        {recent.map((r, i) => {
          const flatIndex = startIndex + i;
          const icon = TYPE_ICONS[r.type] || <SearchOutlined />;
          return (
            <div
              key={`recent-${r.url}-${i}`}
              ref={(el) => {
                this.itemRefs[flatIndex] = el;
              }}
              className={`${styles['search-result']} ${
                flatIndex === selectedIndex ? styles.active : ''
              }`}
              onClick={() => this.navigateTo(r)}
              role="option"
              tabIndex={0}
              aria-selected={flatIndex === selectedIndex}
            >
              <span className={styles['result-icon']}>{icon}</span>
              <span className={styles['result-name']}>{r.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  renderQuickActions(actions, startIndex) {
    if (actions.length === 0) return null;
    const { selectedIndex } = this.state;

    return (
      <div className={styles['search-group']}>
        <div className={styles['group-label']}>
          <ThunderboltOutlined /> Quick Actions
        </div>
        {actions.map((a, i) => {
          const flatIndex = startIndex + i;
          return (
            <div
              key={`qa-${a.url}`}
              ref={(el) => {
                this.itemRefs[flatIndex] = el;
              }}
              className={`${styles['search-result']} ${
                flatIndex === selectedIndex ? styles.active : ''
              }`}
              onClick={() =>
                this.navigateTo({ ...a, name: a.label, type: 'quick_action' })
              }
              role="option"
              tabIndex={0}
              aria-selected={flatIndex === selectedIndex}
            >
              <span className={styles['result-icon']}>{a.icon}</span>
              <span className={styles['result-name']}>{a.label}</span>
              <span className={styles['result-arrow']}>
                <RightOutlined />
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  renderSearchResults() {
    const { results, selectedIndex } = this.state;

    // Group results by type
    const grouped = {};
    results.forEach((item) => {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push(item);
    });

    let flatIndex = 0;
    const groups = [];

    TYPE_ORDER.forEach((type) => {
      if (!grouped[type]) return;
      const items = grouped[type];
      const startIdx = flatIndex;

      groups.push(
        <div key={`group-${type}`} className={styles['search-group']}>
          <div className={styles['group-label']}>
            {TYPE_ICONS[type]} {TYPE_LABELS[type] || type}
          </div>
          {items.map((item, i) => {
            const idx = startIdx + i;
            flatIndex = idx + 1;
            return (
              <div
                key={`result-${item.id}`}
                ref={(el) => {
                  this.itemRefs[idx] = el;
                }}
                className={`${styles['search-result']} ${
                  idx === selectedIndex ? styles.active : ''
                }`}
                onClick={() => this.navigateTo(item)}
                role="option"
                tabIndex={0}
                aria-selected={idx === selectedIndex}
              >
                <span className={styles['result-icon']}>
                  {TYPE_ICONS[item.type] || <SearchOutlined />}
                </span>
                <span className={styles['result-name']}>{item.name}</span>
                {this.renderStatusTag(item.status)}
              </div>
            );
          })}
        </div>
      );
    });

    return { groups, nextIndex: flatIndex };
  }

  renderResults() {
    const { query, loading, noResults } = this.state;
    this.itemRefs = [];

    if (loading) {
      return (
        <div className={styles['search-loading']}>
          <Spin size="small" />
          <span>Searching...</span>
        </div>
      );
    }

    // No query: show recent + all quick actions
    if (!query) {
      const recent = getRecent();
      const recentCount = recent.length;
      return (
        <>
          {this.renderRecentItems(0)}
          {this.renderQuickActions(QUICK_ACTIONS, recentCount)}
        </>
      );
    }

    // Short query (< 2 chars): show filtered quick actions
    if (query.trim().length < 2) {
      const matched = QUICK_ACTIONS.filter((a) => fuzzyMatch(a.label, query));
      return this.renderQuickActions(matched, 0);
    }

    // Full search: results + quick actions
    const { groups, nextIndex } = this.renderSearchResults();
    const matchedActions = QUICK_ACTIONS.filter((a) =>
      fuzzyMatch(a.label, query)
    );

    if (noResults && matchedActions.length === 0) {
      return (
        <div className={styles['search-empty']}>
          No results found for &quot;{query}&quot;
        </div>
      );
    }

    return (
      <>
        {groups}
        {this.renderQuickActions(matchedActions, nextIndex)}
        {noResults && groups.length === 0 && matchedActions.length > 0
          ? null
          : null}
      </>
    );
  }

  render() {
    const { visible, query } = this.state;

    if (!visible) return null;

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div
        className={styles.overlay}
        onClick={this.handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
      >
        <div className={styles.container}>
          <div className={styles['search-header']}>
            <SearchOutlined className={styles['search-icon']} />
            <Input
              ref={this.inputRef}
              className={styles['search-input']}
              placeholder="Search instances, volumes, networks, images..."
              value={query}
              onChange={this.handleInputChange}
              bordered={false}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <kbd className={styles.kbd}>Esc</kbd>
          </div>
          <div
            className={styles['search-results']}
            ref={this.resultsRef}
            role="listbox"
          >
            {this.renderResults()}
          </div>
          <div className={styles['search-footer']}>
            <span>
              <kbd className={styles.kbd}>&uarr;</kbd>
              <kbd className={styles.kbd}>&darr;</kbd> navigate
            </span>
            <span>
              <kbd className={styles.kbd}>Enter</kbd> open
            </span>
            <span>
              <kbd className={styles.kbd}>Esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default inject('rootStore')(observer(GlobalSearch));
