#!/bin/bash
# XLoud Skyline Deploy Script
# Builds locally, deploys to all 3 nodes (XD1, XD2, XD5)
# Usage: ./deploy.sh [frontend|backend|both]

set -e

NODES="103.240.25.201 103.240.25.202 103.240.25.205"
SSH="sshpass -p xloud ssh -o StrictHostKeyChecking=no xloud"
SCP="sshpass -p xloud scp -o StrictHostKeyChecking=no"
CONSOLE_STATIC="/var/lib/kolla/venv/lib/python3/site-packages/skyline_console/static"
API_PKG="/var/lib/kolla/venv/lib/python3.12/site-packages/skyline_apiserver"

MODE="${1:-both}"

deploy_frontend() {
    echo ">>> Building frontend..."
    cd /root/xloud-skyline-console
    npm run build 2>&1 | tail -5

    echo ">>> Packaging static..."
    tar czf /tmp/skyline-static.tar.gz -C skyline_console static/

    for NODE in $NODES; do
        echo ">>> Deploying frontend to $NODE..."
        $SCP /tmp/skyline-static.tar.gz xloud@$NODE:/tmp/skyline-static.tar.gz 2>/dev/null
        $SSH@$NODE "
            sudo docker cp /tmp/skyline-static.tar.gz skyline_console:/tmp/ &&
            sudo docker exec skyline_console rm -rf $CONSOLE_STATIC &&
            sudo docker exec skyline_console tar xzf /tmp/skyline-static.tar.gz -C /var/lib/kolla/venv/lib/python3/site-packages/skyline_console/ &&
            sudo docker restart skyline_console
        " 2>/dev/null
        echo "    $NODE: frontend DONE"
    done
}

deploy_backend() {
    echo ">>> Packaging backend..."
    cd /root/xloud-skyline-apiserver
    tar czf /tmp/skyline-api.tar.gz -C . skyline_apiserver/

    for NODE in $NODES; do
        echo ">>> Deploying backend to $NODE..."
        $SCP /tmp/skyline-api.tar.gz xloud@$NODE:/tmp/skyline-api.tar.gz 2>/dev/null
        $SSH@$NODE "
            sudo docker cp /tmp/skyline-api.tar.gz skyline_apiserver:/tmp/ &&
            sudo docker exec -u root skyline_apiserver bash -c '
                cd /var/lib/kolla/venv/lib/python3.12/site-packages/ &&
                tar xzf /tmp/skyline-api.tar.gz &&
                find skyline_apiserver -name __pycache__ -type d -exec rm -rf {} + 2>/dev/null
                chmod -R 644 skyline_apiserver/api/v1/*.py
            ' &&
            sudo docker exec skyline_apiserver bash -c 'kill -HUP \$(pgrep -f \"gunicorn: master\" | head -1)'
        " 2>/dev/null
        echo "    $NODE: backend DONE"
    done
}

case "$MODE" in
    frontend|fe|f)
        deploy_frontend
        ;;
    backend|be|b)
        deploy_backend
        ;;
    both|all|a)
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo "Usage: $0 [frontend|backend|both]"
        exit 1
        ;;
esac

echo ""
echo ">>> Waiting for services to start..."
sleep 8

# Verify
HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" https://103.240.25.200:9999/)
if [ "$HTTP_CODE" = "200" ]; then
    echo ">>> UI is UP (HTTP $HTTP_CODE)"
else
    echo ">>> WARNING: UI returned HTTP $HTTP_CODE (may still be starting)"
fi

echo ">>> Deploy complete! Check: https://103.240.25.200:9999"
