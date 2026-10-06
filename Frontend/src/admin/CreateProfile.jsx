import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api";

const CreateProfile = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const emailFromLogin = searchParams.get("email") || "";

    const [employee, setEmployee] = useState(null);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /*
    =====================================================
    GET EMPLOYEE DATA
    =====================================================
    */

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!emailFromLogin) {
                setError("Employee email not found.");
                setLoading(false);
                return;
            }

            try {
                const response = await API.get(
                    `/employees/profile?email=${encodeURIComponent(
                        emailFromLogin
                    )}`
                );

                if (response.data.success) {
                    const employeeData = response.data.data;

                    setEmployee(employeeData);
                } else {
                    setError(
                        response.data.message ||
                        "Employee profile not found."
                    );
                }
            } catch (err) {
                console.error(
                    "Fetch employee profile error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load employee profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [emailFromLogin]);

    /*
    =====================================================
    IMAGE CHANGE
    =====================================================
    */

    const handleImageChange = (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        /*
        Check file type
        */

        if (!selectedFile.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        /*
        Check file size - 5 MB
        */

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5 MB.");
            e.target.value = "";
            return;
        }

        setError("");
        setImage(selectedFile);

        /*
        Preview
        */

        const previewUrl = URL.createObjectURL(selectedFile);
        setImagePreview(previewUrl);
    };

    /*
    =====================================================
    SUBMIT PROFILE
    =====================================================
    */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!employee) {
            setError("Employee information not found.");
            return;
        }

        /*
        Image required
        */

        if (!image) {
            setError("Please select a profile image.");
            return;
        }

        try {
            setSubmitting(true);

            /*
            FormData is required for image upload
            */

            const formData = new FormData();

            formData.append("image", image);

            const response = await API.put(
                `/employees/create-profile/${employee.emp_id}`,
                formData
            );

            if (response.data.success) {
                setSuccess("Profile created successfully.");

                setTimeout(() => {
                    navigate(
                        `/admin-login?email=${encodeURIComponent(
                            employee.email
                        )}`
                    );
                }, 1000);
            } else {
                setError(
                    response.data.message ||
                    "Failed to create profile."
                );
            }
        } catch (err) {
            console.error(
                "Create profile error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to create profile."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading) {
        return (
            <div style={styles.center}>
                Loading employee profile...
            </div>
        );
    }

    /*
    =====================================================
    ERROR
    =====================================================
    */

    if (error && !employee) {
        return (
            <div style={styles.center}>
                <div style={styles.errorBox}>
                    {error}
                </div>
            </div>
        );
    }

    /*
    =====================================================
    PAGE
    =====================================================
    */

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                <h1 style={styles.title}>
                    Create Profile
                </h1>

                <p style={styles.subtitle}>
                    Employee details are automatically
                    loaded from the database.
                </p>

                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={styles.successBox}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Employee Code */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Employee Code
                        </label>

                        <input
                            type="text"
                            value={
                                employee?.employee_code || ""
                            }
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    {/* Employee Name */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Employee Name
                        </label>

                        <input
                            type="text"
                            value={
                                employee?.emp_name || ""
                            }
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    {/* Email */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Email
                        </label>

                        <input
                            type="email"
                            value={
                                employee?.email || ""
                            }
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    {/* Phone */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Phone
                        </label>

                        <input
                            type="text"
                            value={
                                employee?.phone || ""
                            }
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    {/* Department */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Department
                        </label>

                        <input
                            type="text"
                            value={
                                employee?.department_name || ""
                            }
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    {/* Date Of Join */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Date Of Join
                        </label>

                        <input
                            type="date"
                            value={
                                employee?.date_of_join
                                    ? employee.date_of_join.substring(
                                          0,
                                          10
                                      )
                                    : ""
                            }
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    {/* Profile Image */}

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Profile Image
                        </label>

                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleImageChange}
                            style={styles.fileInput}
                        />

                        {imagePreview && (
                            <div style={styles.previewContainer}>
                                <img
                                    src={imagePreview}
                                    alt="Profile Preview"
                                    style={styles.preview}
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit */}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            ...styles.button,
                            opacity: submitting ? 0.6 : 1
                        }}
                    >
                        {submitting
                            ? "Creating Profile..."
                            : "Submit"}
                    </button>

                </form>
            </div>
        </div>
    );
};

/*
=====================================================
STYLES
=====================================================
*/

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f6fa",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px"
    },

    card: {
        width: "100%",
        maxWidth: "600px",
        background: "#ffffff",
        padding: "35px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)"
    },

    title: {
        textAlign: "center",
        marginBottom: "10px"
    },

    subtitle: {
        textAlign: "center",
        color: "#666",
        marginBottom: "25px"
    },

    field: {
        marginBottom: "18px"
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontWeight: "600"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "15px",
        background: "#f9fafb"
    },

    fileInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        background: "#ffffff"
    },

    previewContainer: {
        marginTop: "15px",
        display: "flex",
        justifyContent: "center"
    },

    preview: {
        width: "120px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "50%",
        border: "3px solid #ddd"
    },

    button: {
        width: "100%",
        padding: "12px",
        border: "none",
        borderRadius: "7px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "16px",
        cursor: "pointer"
    },

    errorBox: {
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "15px"
    },

    successBox: {
        background: "#dcfce7",
        color: "#166534",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "15px"
    },

    center: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
    }
};

export default CreateProfile;
