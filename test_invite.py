import requests
import jwt
import time

service_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTY0MTc2OTIwMCwiZXhwIjoxNzk5NTM1NjAwfQ.mmNb6xjSTFI4CEq91PqBGa_SYrSi0TkYboF4W4PwNEU'
headers = {
    'apikey': service_key,
    'Authorization': 'Bearer ' + service_key,
    'Content-Type': 'application/json'
}

r = requests.get('http://localhost:8000/rest/v1/organizations?name=eq.payment%20testing%202', headers=headers)
orgs = r.json()
if not orgs:
    r = requests.get('http://localhost:8000/rest/v1/organizations?select=id,name&limit=1', headers=headers)
    orgs = r.json()
org_id = orgs[0]['id']
print('Org:', org_id, orgs[0]['name'])

r_mem = requests.get('http://localhost:8000/rest/v1/organization_members?org_id=eq.' + org_id, headers=headers)
members = r_mem.json()
print('Member count:', len(members))
user_id = members[0]['user_id']

jwt_secret = '6c9e1d90659d4b78ab096805bfe6f019e9f3c8c9470ecd87bb84f640b3d5e971'
payload = {
    'sub': user_id,
    'role': 'authenticated',
    'aud': 'authenticated',
    'exp': int(time.time()) + 3600
}
token = jwt.encode(payload, jwt_secret, algorithm='HS256')
if isinstance(token, bytes):
    token = token.decode('utf-8')

user_headers = {
    'apikey': service_key,
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
}

print('Calling invite-team-member...')
res = requests.post('http://localhost:8000/functions/v1/invite-team-member', headers=user_headers, json={
    'email': 'lokenow808@maxtanie.com',
    'role': 'staff',
    'org_id': org_id,
    'permissions': ['settings']
})
print('Status:', res.status_code)
print('Response:', res.text)
