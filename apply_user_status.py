import os
import re

user_path = "js/usuario.js"

with open(user_path, "r", encoding="utf-8") as f:
    user_content = f.read()

# Fix order status colors in usuario.js
old_status_logic = """    let statusColor = '#f59e0b';
    let statusIcon = 'ph-clock-countdown';
    if (order.status === 'processing') { statusColor = '#3b82f6'; statusIcon = 'ph-spinner-gap'; }
    if (order.status === 'completed') { statusColor = '#0ea5e9'; statusIcon = 'ph-check-circle'; }
    if (order.status === 'rejected') { statusColor = '#ef4444'; statusIcon = 'ph-x-circle'; }"""

new_status_logic = """    let statusColor = '#f59e0b';
    let statusIcon = 'ph-clock-countdown';
    if (order.status === 'processing' || order.status === 'procesando') { statusColor = '#3b82f6'; statusIcon = 'ph-spinner-gap'; }
    if (order.status === 'completed' || order.status === 'completado') { statusColor = '#0ea5e9'; statusIcon = 'ph-check-circle'; }
    if (order.status === 'rejected' || order.status === 'rechazado') { statusColor = '#ef4444'; statusIcon = 'ph-x-circle'; }"""

user_content = user_content.replace(old_status_logic, new_status_logic)

with open(user_path, "w", encoding="utf-8") as f:
    f.write(user_content)
