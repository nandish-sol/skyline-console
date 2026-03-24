import re

with open("/etc/nginx/nginx.conf", "r") as f:
    content = f.read()

if "regionone/watcher" in content:
    print("Watcher proxy already exists")
else:
    watcher_block = """
        location /api/openstack/regionone/watcher {
            proxy_pass http://10.0.1.73:9322/;
            proxy_redirect http://10.0.1.73:9322/ /api/openstack/regionone/watcher/;
            proxy_buffering off;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header Host $http_host;
        }
"""
    # Insert after masakari block
    pattern = r"(location /api/openstack/regionone/masakari \{[^}]+\})"
    content = re.sub(pattern, r"\1" + watcher_block, content)
    
    with open("/etc/nginx/nginx.conf", "w") as f:
        f.write(content)
    print("Watcher proxy added")
