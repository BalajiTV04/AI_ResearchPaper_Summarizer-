import json, urllib.request

results = {}

# Backend
try:
    r = urllib.request.urlopen('http://localhost:8000/', timeout=5)
    results['backend'] = json.loads(r.read().decode())
except Exception as e:
    results['backend'] = f'FAIL: {e}'

# Frontend
try:
    r = urllib.request.urlopen('http://localhost:3000/', timeout=5)
    results['frontend'] = f'OK (HTTP {r.status})'
except Exception as e:
    results['frontend'] = f'FAIL: {e}'

# Swagger docs
try:
    r = urllib.request.urlopen('http://localhost:8000/docs', timeout=5)
    results['api_docs'] = f'OK (HTTP {r.status})'
except Exception as e:
    results['api_docs'] = f'FAIL: {e}'

with open('final_check_result.json', 'w') as f:
    json.dump(results, f, indent=2)

print(json.dumps(results, indent=2))