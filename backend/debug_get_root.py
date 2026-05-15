import httpx
try:
    r = httpx.get('http://127.0.0.1:8000/')
    print('status', r.status_code)
    print('body', r.text)
except Exception as e:
    print('request failed:', type(e), e)
