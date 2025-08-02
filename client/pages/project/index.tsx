"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { Toaster } from "react-hot-toast";
import { AppDispatch } from "../../store";
import { fetchProjects, addProject, updateProject } from "../../features/projectSlice";
import { fetchUser } from "../../features/userSlice";
import Breadcrumbs from "../../components/BreadCrumb/breadCrumb";
import CustomDialog from "@/components/ui/CustomDialog";
import styles from "./project.module.scss";


// Interfaces
interface ProjectFormData {
    company_id: string;
    project_name: string;
}

interface Project {
    project_id: string;
    company_id: string;
    project_name: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    project_status?: boolean;
}

interface ProjectState {
    list: (Project | undefined)[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

interface UserData {
    user_id: string;
    full_name: string;
    email: string;
    role: string;
    company_id: string;
    company_name: string;
    iat?: number;
    exp?: number;
}


const Project: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { list = [], status } = useSelector((state: { project: ProjectState }) => state.project);
    const projects: Project[] = list.filter((p): p is Project => p !== undefined);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<ProjectFormData>({ company_id: "", project_name: "" });
    const [editProjectId, setEditProjectId] = useState<string | null>(null);
    const [editProjectName, setEditProjectName] = useState<string>("");
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);




    useEffect(() => {
        dispatch(fetchProjects());
        (async () => {
            try {
                const response = await dispatch(fetchUser()).unwrap();

                setUserData(response);
            } catch (err) {
                console.error("Failed to fetch user:", err);
            }
        })();
    }, [dispatch]);

    useEffect(() => {
        if (userData) {
            setFormData((prev) => ({ ...prev, company_id: userData.company_id }));
        }
    }, [userData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (editProjectId) {
            setEditProjectName(value);
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (editProjectId) {
                await dispatch(updateProject({ project_id: editProjectId, project_name: editProjectName })).unwrap();
            } else {
                await dispatch(addProject(formData)).unwrap();
            }
            await dispatch(fetchProjects());
            setFormData({ ...formData, project_name: "" });
            setEditProjectId(null);
            setEditProjectName("");
            setIsModalOpen(false);
        } catch (err) {
            console.error("Add/update project failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStatus = (status?: boolean) => (
        <span className="flex items-center gap-2">
            <Icon icon={status ? "mdi:check-circle" : "mdi:close-circle"} className={`w-4 h-4 ${status ? "text-green-500" : "text-red-500"}`} />
            <span className="text-xs font-medium">{status ? "Active" : "Inactive"}</span>
        </span>
    );

    return (
        <div className={styles["main-container"]}>
            <Breadcrumbs />
            <Toaster position="top-center" reverseOrder={false} />

            {/* Header */}
            <div className={styles["project-header"]}>
                <span className="text-xl font-semibold">Project</span>
                {userData && userData?.role === "admin" && (
                    <button
                        onClick={() => {
                            setEditProjectId(null);
                            setEditProjectName("");
                            setFormData({ ...formData, project_name: "" });
                            setIsModalOpen(true);
                        }}
                        className="bg-[#ffac00] text-[#1a315d] font-bold px-4 py-2 rounded-lg hover:bg-[#e69a00] transition text-xs flex items-center gap-2 cursor-pointer"
                    >
                        <Icon icon="mdi:plus" className="h-4 w-4" />
                        Add Project
                    </button>
                )}
            </div>

            {/* Project Table */}
            <div className="mt-3">
                <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
                    {status === "loading" ? (
                        <div className="text-center text-gray-500 p-6">
                            <Icon icon="mdi:loading" className="w-6 h-6 mx-auto animate-spin" />
                            <p>Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center text-gray-700 p-6">
                            <p className="text-lg font-semibold">No projects found. Please add a new project.</p>
                        </div>
                    ) : (
                        <table className={`${styles["project-table"]} w-full text-sm`}>
                            <thead className="bg-gray-100">
                                <tr>
                                    <th>S.No</th>
                                    <th>Project Name</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Updated</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project, index) => (
                                    <tr key={project.project_id} className="border-b">
                                        <td>{index + 1}</td>
                                        <td>{project.project_name}</td>
                                        <td>{renderStatus(project.project_status)}</td>
                                        <td>{project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}</td>
                                        <td>{project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "N/A"}</td>
                                        <td>
                                            <button
                                                className="text-blue-600 hover:underline flex items-center gap-1  cursor-pointer"
                                                onClick={() => {
                                                    setEditProjectId(project.project_id);
                                                    setEditProjectName(project.project_name);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <Icon icon="mdi:pencil" className="w-4 h-4" />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal using CustomDialog */}
            <CustomDialog
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title={
                    <span className="flex items-center gap-2">
                        <Icon icon="mdi:folder-plus" className="w-5 h-5 text-[#1a315d]" />
                        {editProjectId ? "Update Project" : "Create Project"}
                    </span>
                }
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditProjectId(null);
                                setEditProjectName("");
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="projectForm"
                            className="px-4 py-2 bg-[#007a7a] text-white rounded hover:bg-[#006565] disabled:opacity-50 flex items-center gap-2"
                            disabled={isSubmitting || !(editProjectId ? editProjectName.trim() : formData.project_name.trim())}
                        >
                            {isSubmitting ? (
                                <>
                                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="mdi:check" className="w-4 h-4" />
                                    Submit
                                </>
                            )}
                        </button>
                    </>
                }
            >
                <form id="projectForm" onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="project_name"
                        placeholder="Project Name"
                        value={editProjectId ? editProjectName : formData.project_name}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                </form>
            </CustomDialog>
        </div>
    );
};

export default Project;
