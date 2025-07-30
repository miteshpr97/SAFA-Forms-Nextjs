##### **FORM Builder**

User Authorization

 **FormBuilder Project - Authentication and Authorization Documentation**

---

# 1. Introduction

FormBuilder is a platform that allows companies to dynamically create and manage multiple forms and projects. The system implements secure authentication and role-based authorization for three types of users:

* **Super Admin** : The owner/developer of the platform (e.g., Globus Labs).
* **Admin** : Company administrators who register, create projects, forms, and manage users.
* **User** : Company employees who interact with assigned projects and forms.

---

# 2. Authentication (Login and Registration)

## 2.1 Registration

* **Admin Registration** : Admins register their companies.
* Required Fields: Company Name, Admin Name, Email, Password.
* After successful registration, Admin can manage company-specific resources.
* **Super Admin** : Pre-registered internally; manages platform-wide settings.
* **User Registration** : Admin creates Users inside their own company account.

## 2.2 Login

* Single login portal for Super Admin, Admin, and Users.
* Credentials: Email and Password.
* On success: A secure token/session (e.g., JWT) is generated.
* On failure: Error message "Invalid Credentials".

---

# 3. Authorization (Role-Based Access Control)

## 3.1 Super Admin Permissions

* Manage all companies (view, block, delete Admins).
* View and monitor all projects and forms across companies.
* Control platform settings.

## 3.2 Admin Permissions

* Create multiple Projects (e.g., ABC_PROJECT, XYZ_PROJECT).
* Create multiple Forms under each Project (e.g., FORM1, FORM2).
* Create and manage Users within the company.
* Assign Users to specific Projects and Forms.

Example:

* **Admin1** creates:
  * **Project** : ABC_PROJECT
  * **Forms** : FORM_A, FORM_B
  * **Project** : XYZ_PROJECT
  * **Forms** : FORM_X, FORM_Y
* Admin assigns UserA to access FORM_A and FORM_X only.

## 3.3 User Permissions

* Access only assigned Projects and Forms.
* Fill, update, or manage assigned forms based on permissions.
* Cannot create Projects, Forms, or Users.

---

# 4. User Flow Diagram

```
[Super Admin] ➔ Create Admin
[Admin] ➔ Create Projects ➔ Create Forms ➔ Assign Users
[User] ➔ Access Assigned Projects and Forms
```

---

# 5. Database Design (Authentication & Authorization)

* **users** table:
  * Fields: id, name, email, password (hashed), role (super_admin/admin/user), company_id
* **companies** table:
  * Fields: id, company_name, admin_user_id
* **projects** table:
  * Fields: id, project_name, company_id
* **forms** table:
  * Fields: id, form_name, project_id
* **user_project_assignments** table:
  * Fields: user_id, project_id
* **user_form_assignments** table:
  * Fields: user_id, form_id

---

# 6. API Authentication (Optional for API-based projects)

* **POST** `/login`
* **POST** `/register`
* JWT token issued on login.
* Middleware checks user role and permissions.

Example (in code):

```javascript
if (user.role === 'admin') {
   // Allow creating projects
} else {
   // Deny access
}
```

---

# 7. Security Practices

* Password hashing (bcrypt or similar)
* Token expiration handling
* Session management
* Role validation on backend APIs (important: not only frontend validation)
* Activity logging for Admin actions

---

# 8. Error Handling

* Unauthorized access: **401 Unauthorized**
* Forbidden action (no permission): **403 Forbidden**
* Invalid login credentials: Display appropriate error message

---

# 9. Conclusion

This authentication and authorization system ensures that only valid and authorized users can access the resources intended for them, maintaining the security and integrity of the Dloper FormBuilder platform.

---
