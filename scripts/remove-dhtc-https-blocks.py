#!/usr/bin/env python3
"""Remove DHTC-FE HTTPS blocks from nginx.conf IN-PLACE.

Preserves the file's inode so Docker bind-mount containers see the update
immediately — sed -i creates a new inode, which the container never sees.
"""
import re

NGINX_CONF = "/opt/stock-dashboard/nginx/nginx.conf"

content = open(NGINX_CONF).read()
cleaned = re.sub(
    r"\n# >>> DHTC-FE-[^\n]*-HTTPS[^\n]*\n.*?# <<< DHTC-FE-[^\n]*-HTTPS[^\n]*\n",
    "\n",
    content,
    flags=re.DOTALL,
)
open(NGINX_CONF, "w").write(cleaned)

removed = content.count("# >>> DHTC-FE-") - cleaned.count("# >>> DHTC-FE-")
print(f"Removed {removed} DHTC-FE HTTPS block(s) in-place (inode preserved)")
