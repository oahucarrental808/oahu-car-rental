#!/bin/bash
# Quick script to check SMS-related logs from submitRequest function

echo "Checking Firebase Functions logs for submitRequest..."
echo "=================================================="
echo ""

# Check recent logs and filter for SMS-related entries
firebase functions:log --only submitRequest -n 50 | grep -i -E "(sms|SMS|debug mode|ADMIN_NUMBER|phone|notification)" || echo "No SMS-related logs found in recent entries"

echo ""
echo "=================================================="
echo "For more detailed logs, run:"
echo "  firebase functions:log --only submitRequest -n 100"
echo ""
echo "To open logs in browser:"
echo "  firebase functions:log --open"
