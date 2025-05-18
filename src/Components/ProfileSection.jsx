import { useState, useEffect } from "react";
import { FiImage, FiSave, FiX, FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ProfileSection({ onClose }) {
    const [userData, setUserData] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setUserData(user);
            // Use cimage as the primary source since it's defined in the User model
            const imageSource = user.cimage || user.image || "";
            setImageUrl(imageSource);
            setPreviewImage(imageSource);

            // Log the image source for debugging
            console.log("ProfileSection - Initial image source:", imageSource);
        }
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setImageUrl(value);
        setPreviewImage(value);
    };

    const handleDeleteAccount = () => {
        // Show confirmation dialog first
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        // User has confirmed, proceed with deletion
        deleteUserAccount();
    };

    const deleteUserAccount = async () => {
        if (!userData || !userData._id) {
            toast.error("User data not found. Please log in again.");
            return;
        }

        setIsLoading(true);

        try {
            // Send delete request to the backend
            const response = await fetch(`http://localhost:5000/api/users/${userData._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Your account has been deleted successfully");

                // Clear user data from localStorage
                localStorage.removeItem('user');

                // Close the modal if onClose is provided
                if (onClose) {
                    onClose();
                }

                // Redirect to login page
                setTimeout(() => {
                    navigate('/login');
                }, 1500); // Give time for the toast to be seen
            } else {
                toast.error(data.error || "Failed to delete account");
                setShowDeleteConfirm(false);
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error("An error occurred while deleting your account");
            setShowDeleteConfirm(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!userData || !userData._id) {
                toast.error("User data not found. Please log in again.");
                setIsLoading(false);
                return;
            }

            // Prepare data for update (only updating cimage field)
            const updateData = {
                image: imageUrl // The backend will use this to update cimage
            };

            // Send update request
            const response = await fetch(`http://localhost:5000/api/users/${userData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                // Update local storage with new user data
                const updatedUser = {
                    ...userData,
                    cimage: imageUrl // Only update cimage field since that's what's in the User model
                };

                console.log("Updating user in localStorage with new profile picture:", updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                toast.success("Profile picture updated successfully!");

                // Force the UserProfile component to update by triggering a re-render
                // This is done by updating localStorage and then closing the modal

                // Close the profile section if onClose is provided
                if (onClose) {
                    // Small delay to ensure localStorage is updated before the modal closes
                    setTimeout(() => {
                        onClose();
                    }, 100);
                }
            } else {
                toast.error(data.error || "Failed to update profile picture");
            }
        } catch (error) {
            console.error("Error updating profile picture:", error);
            toast.error("An error occurred while updating your profile picture");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Update Profile Picture</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="text-xl" />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image Preview */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-blue-500 mb-4">
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://s3.amazonaws.com/images/doctor.png';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                                <FiImage className="text-4xl" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Image URL Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Image URL
                    </label>
                    <div className="relative">
                        <FiImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={handleChange}
                            placeholder="Enter image URL"
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                        Enter a direct URL to an image (JPG, PNG, etc.). The image will be displayed as your profile picture.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <FiSave />
                            <span>Update Profile Picture</span>
                        </>
                    )}
                </button>

                {/* Delete Account Button - Only show for patients */}
                {userData && !userData.isDoctor && (
                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>

                        {showDeleteConfirm ? (
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                                <div className="flex items-start mb-3">
                                    <FiAlertTriangle className="text-red-400 text-xl mr-2 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-300 font-semibold">Are you sure?</h4>
                                        <p className="text-sm text-gray-300">
                                            This will permanently delete your account, appointments, and all associated data.
                                            You cannot undo this action.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={isLoading}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        ) : (
                                            <span>Yes, Delete Account</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
                            >
                                <FiX />
                                <span>Delete My Account</span>
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
