"use client"; // Only for app router
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Breadcrumbs from "@/components/BreadCrumb/breadCrumb";
import styles from "./dashboard.module.scss";



const Dashboard = () => {
    const router = useRouter();
   
    return (
        <div className={styles["main-container"]}>
            <Breadcrumbs />
            <div className={styles["card-grid"]}>
                {/* Project */}
                <div className={styles["dashboard-card"]}>
                    <div className={styles["card-header"]}>
                        <Icon icon="mdi:cog" className="text-[#BB86FC]" />
                        <h2>Project</h2>
                    </div>
                    <p>Create and manage projects and associated forms.</p>
                    <button className={styles["dashboard-button"]} onClick={() => router.push("/project")}>
                        Manage Project
                    </button>
                </div>

                {/* Manage Forms */}
                <div className={styles["dashboard-card"]}>
                    <div className={styles["card-header"]}>
                        <Icon icon="mdi:form-textbox" className="text-[#03DAC6]" />
                        <h2>Manage Forms</h2>
                    </div>
                    <p>Create, edit, and manage form structures.</p>
                    <button className={styles["dashboard-button"]} onClick={() => router.push("/manage-forms")}>
                        Manage Forms
                    </button>
                </div>

                {/* Responses */}
                <div className={styles["dashboard-card"]}>
                    <div className={styles["card-header"]}>
                        <Icon icon="mdi:eye" className="text-[#FFD54F]" />
                        <h2>Responses</h2>
                    </div>
                    <p>View and analyze submitted form responses.</p>
                    <button className={styles["dashboard-button"]} onClick={() => router.push("/response")}>
                        View Responses
                    </button>
                </div>

                {/* Form Access */}
                <div className={styles["dashboard-card"]}>
                    <div className={styles["card-header"]}>
                        <Icon icon="mdi:lock" className="text-[#FFB300]" />
                        <h2>Form Access</h2>
                    </div>
                    <p>Manage who can access and fill out forms.</p>
                    <button className={styles["dashboard-button"]} onClick={() => router.push("/form-access")}>
                        Manage Access
                    </button>
                </div>

                {/* Users */}
                <div className={styles["dashboard-card"]}>
                    <div className={styles["card-header"]}>
                        <Icon icon="mdi:account-group" className="text-[#64B5F6]" />
                        <h2>Users</h2>
                    </div>
                    <p>Add, view, and manage system users.</p>
                    <button className={styles["dashboard-button"]} onClick={() => router.push("/users-management")}>
                        Manage Users
                    </button>
                </div>

                {/* Analytics */}
                <div className={styles["dashboard-card"]}>
                    <div className={styles["card-header"]}>
                        <Icon icon="mdi:chart-bar" className="text-[#4CAF50]" />
                        <h2>Analytics</h2>
                    </div>
                    <p>Explore form data with charts and metrics.</p>
                    <button className={styles["dashboard-button"]} onClick={() => router.push("/analytics")}>
                        View Analytics
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
