import { useEffect, useState } from "react";
import { generateAvatar } from "../utils/avatarGenerator";

export default function UserProfile() {
    const [userData, setUserData] = useState(null);
    const [avatar, setAvatar] = useState({ initials: "", bgColor: "" });
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        // This effect runs every time the component mounts or re-renders
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setUserData(user);

            // Generate avatar from username or doctor name if available
            const displayName = user.doctorProfile?.name || user.name || user.username;
            const newAvatar = generateAvatar(displayName);
            setAvatar(newAvatar);

            // Log user data for debugging
            console.log("User data from localStorage:", user);

            // Set profile image for all users if available
            // Check all possible image fields with priority
            // For debugging, log all possible image sources
            console.log("Image sources:", {
                image: user.image,
                cimage: user.cimage,
                doctorProfileImage: user.doctorProfile?.image
            });

            // Use cimage as the primary source since it's defined in the User model
            const imageSource = user.cimage || user.image ||
                               (user.doctorProfile ? user.doctorProfile.image : null);

            if (imageSource) {
                console.log("Setting profile image from source:", imageSource);
                setProfileImage(imageSource.startsWith('http')
                    ? imageSource
                    : `http://localhost:5000${imageSource}`);
            } else {
                // Reset profile image if none is found
                setProfileImage(null);
                console.log("No profile image found in user data");
            }

            // For doctors, also fetch the latest profile data
            if (user.isDoctor) {
                // Set doctor profile if it exists in user data (as a temporary display)
                if (user.doctorProfile) {
                    setDoctorProfile(user.doctorProfile);
                }

                // Always fetch the latest doctor profile data
                fetchDoctorProfile(user._id);
            }
        }
    }, []);

    const fetchDoctorProfile = async (userId) => {
        try {
            console.log("Fetching doctor profile for user:", userId);
            const response = await fetch(`http://localhost:5000/api/doctors/user/${userId}`);

            if (!response.ok) {
                console.error("Failed to fetch doctor profile. Status:", response.status);
                return;
            }

            const data = await response.json();

            if (data.success && data.data) {
                console.log("Doctor profile fetched successfully:", data.data);

                // Always update the doctor profile state with the latest data
                setDoctorProfile(data.data);

                // Set profile image if available
                if (data.data.image) {
                    const imageUrl = data.data.image.startsWith('http')
                        ? data.data.image
                        : `http://localhost:5000${data.data.image}`;
                    setProfileImage(imageUrl);
                }

                // Always update user data in localStorage with the latest doctor profile
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                    // Create a new user object with the updated doctor profile
                    const updatedUser = {
                        ...user,
                        doctorProfile: data.data,
                        // Also update the user fields with doctor profile data for consistency
                        name: data.data.name || user.name,
                        specialization: data.data.specialization || user.specialization,
                        hospital: data.data.hospital || user.hospital,
                        consultationFee: data.data.consultationFee || user.consultationFee
                    };

                    // Update the image if available
                    if (data.data.image) {
                        updatedUser.image = data.data.image;
                    }

                    // Save the updated user data to localStorage
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log("User data updated with doctor profile");
                }
            } else {
                console.log("No doctor profile found or error:", data.error);

                // If no doctor profile found but user has registration data, display that
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.isDoctor && (user.name || user.specialization || user.hospital)) {
                    console.log("Using registration data for doctor profile display");

                    // Create a temporary doctor profile from registration data
                    const tempProfile = {
                        name: user.name || user.username,
                        specialization: user.specialization || "Medical Doctor",
                        hospital: user.hospital || "General Hospital",
                        consultationFee: user.consultationFee || 2000,
                        image: user.image || user.cimage
                    };

                    setDoctorProfile(tempProfile);

                    if (tempProfile.image) {
                        const imageUrl = tempProfile.image.startsWith('http')
                            ? tempProfile.image
                            : `http://localhost:5000${tempProfile.image}`;
                        setProfileImage(imageUrl);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching doctor profile:", error);
        }
    };

    return (
        <div className="flex flex-col items-center mt-4 mb-8">
            {profileImage ? (
                // Show profile image for any user who has one
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400/50">
                    <img
                        src={profileImage}
                        alt={(doctorProfile?.name || userData?.username) || "Profile"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://s3.amazonaws.com/images/doctor.png'; // Default image on error
                        }}
                    />
                </div>
            ) : (
                // Show avatar for users without profile image
                <div className={`w-16 h-16 rounded-full ${avatar.bgColor} flex items-center justify-center text-white text-2xl font-bold`}>
                    {avatar.initials}
                </div>
            )}
            <h2 className="text-xl font-bold mt-4 text-blue-300">
                {userData?.isDoctor
                    ? `Dr. ${doctorProfile?.name || userData?.username}`
                    : userData?.username || "Loading..."}
            </h2>
            {userData?.isDoctor && doctorProfile && (
                <div className="text-center">
                    <p className="text-sm text-gray-300 mt-1">
                        {doctorProfile.specialization}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {doctorProfile.hospital}
                    </p>
                </div>
            )}
            {!userData?.isDoctor && (
                <p className="text-sm text-gray-400">
                    Patient
                </p>
            )}
        </div>
    );
}

