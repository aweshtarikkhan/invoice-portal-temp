SELECT o.id, o.name, o.owner_id, u.email as owner_email 
FROM organizations o 
LEFT JOIN auth.users u ON o.owner_id = u.id 
WHERE o.name = 'payment testing 2';

SELECT om.user_id, om.role, om.permissions, u.email
FROM organization_members om
LEFT JOIN auth.users u ON om.user_id = u.id
JOIN organizations o ON om.org_id = o.id
WHERE o.name = 'payment testing 2';
