# API Documentation

## APIs Related to Company
- **All belongs to super admin**

- **Add Company**  
  `POST`  

    http://localhost:5000/api/v1/company/addCompany


- **Get Companies**  
`GET`  

    http://localhost:5000/api/v1/company/getCompanies


- **Get Company by ID**  
`GET`  

    http://localhost:5000/api/v1/company/getCompanyById/:company_id


- **Delete Company**  
`DELETE`  

    http://localhost:5000/api/v1/company/deleteCompany/:company_id


---

## APIs Related to Project

- **Add Project**  
_Only super-admin and admin can create projects. Admin can only create projects for their own company._  
`POST`  

    http://localhost:5000/api/v1/project/addProject


- **Get Projects**  
_Admins can see all projects of their company. Users can only see projects they have access to._  
`GET`  

    http://localhost:5000/api/v1/project/getProjects


- **Get Projects by Company ID**  
_Only for super admin._  
`GET`  

    http://localhost:5000/api/v1/project/getProjectsByCompanyId/:company_id


- **Get Project by ID**  
_Super-admin can access all. Admins can access their company’s projects. Users can access only allowed ones._  
`GET`  

    http://localhost:5000/api/v1/project/getProjectById/:project_id


- **Delete Project**  
`DELETE`  

    http://localhost:5000/api/v1/project/deleteProject/:project_id


---

## APIs Related to User

- **Add User**  
`POST`  

    http://localhost:5000/api/v1/user/addUser


- **Get My Profile**  
_Provides logged-in user's info._  
`GET`  

    http://localhost:5000/api/v1/user/getMe


- **Get Users**  
_Only for Admin. Can access users of their own company only._  
`GET`  

    http://localhost:5000/api/v1/user/getUsers


- **Get Users by Company ID**  
_Only for super-admin._  
`GET`  

    http://localhost:5000/api/v1/user/getUsersByCompanyId/:company_id


- **Get User by ID**  
_Only for super-admin and admin. Admin can access users of their company only._  
`GET`  

    http://localhost:5000/api/v1/user/getUserById/:user_id


- **Delete User**  
`DELETE`  

    http://localhost:5000/api/v1/user/deleteUser/:user_id


- **Login User**  
`POST`  

    http://localhost:5000/api/v1/user/login


- **Logout User**  
`GET`  

    http://localhost:5000/api/v1/user/logout


---

## APIs Related to Form

- **Add Form**  
_Only super-admin and admin can create. Admin can only create forms for their company._  
`POST`  

    http://localhost:5000/api/v1/form/addForm


- **Get Forms**  
_Admin can view all forms of their company. Users can only see assigned forms._  
`GET`  

    http://localhost:5000/api/v1/form/getForms


- **Get Forms by Company ID**  
_Only for super admin._  
`GET`  

    http://localhost:5000/api/v1/form/getFormsByCompanyId/:company_id


- **Get Form by ID**  
_Super-admin has full access. Admins limited to company forms. Users limited to assigned forms._  
`GET`  

    http://localhost:5000/api/v1/form/getFormById/:form_id


---

## APIs Related to Form Field

- **Add Form Fields**  
_Only super-admin and admin can create. Admin limited to their company’s forms._  
`POST`  

    http://localhost:5000/api/v1/formField/addFormFields


- **Get Fields by Form ID**  
_Access based on roles and permissions._  
`GET`  

    http://localhost:5000/api/v1/formField/getFieldsByFormId/:form_id


- **Update Form Fields**  
_Super-admin can update all. Admins limited to their company’s forms._  
`PUT`  

    http://localhost:5000/api/v1/formField/updateFormFields


---

## APIs Related to Submission

- **Add Submission**  
_Super-admin: all forms, Admin: only company forms, User: assigned forms only._  
`POST`  

    http://localhost:5000/api/v1/response/addSubmission


- **Get Responses by Form ID**  
_Role-based visibility: super-admin, admin, or self._  
`GET`  

    http://localhost:5000/api/v1/response/getResponses/:form_id


- **Update Submission by ID**  
_Only the user who submitted it can update it._  
`PUT`  

    http://localhost:5000/api/v1/response/updateResponse/:submission_id


---

## APIs Related to Access

- **Add Access**  
_Only super-admin and admin. Admin limited to their company’s forms._  
    > _Note: Not used on frontend now. Achieved via update API instead._  
`POST`  

    http://localhost:5000/api/v1/access/addAccess


- **Get Access Template**  
_Admin uses this to grant user access._  
`GET`  

    http://localhost:5000/api/v1/access/getTemplate


- **Get Access by User ID**  
_Super-admin: all users, Admin: only users from their company._  
`GET`  

    http://localhost:5000/api/v1/access/getAccess/:user_id


- **Update/Add Access**  
_Super-admin/admin can add or update user access (Admin limited to company users)._  
`POST`  

    http://localhost:5000/api/v1/access/updateAccess


> Working logic: If the user already has access to the form, it gets updated. Otherwise, a new entry is created in the access table.
