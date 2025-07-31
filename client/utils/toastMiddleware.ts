
import { Middleware } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
// import { addProject } from "../features/projectSlice";
// import { addForms } from "../features/formsSlice";
// import { addFields, updateFields } from "../features/fieldSlice";

const toasterMiddleware: Middleware = () => (next) => (action) => {
  // ✅ SUCCESS toasts
//   if (addProject.fulfilled.match(action)) {
//     toast.success(action.payload.message || "Project created successfully!");
//   }

//   if (addForms.fulfilled.match(action)) {
//     toast.success(action.payload.message || "Form created successfully!");
//   }

//   if (addFields.fulfilled.match(action)) {
//     toast.success(action.payload.message || "Fields added successfully!");
//   }

//   if (addFields.rejected.match(action)) {
//     toast.error(action.payload || "Failed to add fields.");
//   }

//   if (updateFields.fulfilled.match(action)) {
//     toast.success(action.payload.message || "Fields updated successfully!");
//   }

//   if (updateFields.rejected.match(action)) {
//     toast.error(
//       (typeof action.payload === "string" && action.payload) ||
//         action.error.message ||
//         "Failed to update fields."
//     );
//   }

//   return next(action);
};

export default toasterMiddleware;
