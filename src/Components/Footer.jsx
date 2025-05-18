import { Link } from "react-router-dom";
import { FaFacebook, FaLinkedin, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion } from "framer-motion";

function Footer() {
    return (
        <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-900 to-blue-950 text-white py-10 mt-1 rounded-t-3xl font-[Outfit] shadow-lg"
        >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between px-8">
                {/* Left Section: Logo and Contact Info */}
                <div className="flex flex-col items-center sm:items-start mb-8 sm:mb-0">
                    <img src="../../public/health.png" alt="MediHome Logo" className="h-12 w-32" />
                    <p className="text-gray-300 mt-4">support@medihome.com</p>
                    <p className="text-gray-300">+1 800 123 4567</p>
                </div>

                {/* Quick Links Section */}
                <div className="space-y-4 mb-2 sm:mb-0">
                    <h3 className="font-semibold text-left text-gray-200 text-lg">Quick Links</h3>
                    <div className="space-y-2 text-left flex flex-col">
                        {["Dashboard", "Appointments", "Patients", "Profile"].map((item, index) => (
                            <Link
                                key={index}
                                to={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                                className="text-gray-400 hover:text-emerald-400 hover:font-bold transition"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="space-y-4 mb-8 sm:mb-0">
                    <h3 className="font-semibold text-gray-200 text-lg">Follow Us</h3>
                    <div className="flex space-x-6">
                        {[FaFacebook, FaLinkedin, FaInstagram, FaTwitter].map((Icon, index) => (
                            <motion.a
                                key={index}
                                href="#"
                                className="text-gray-400 hover:text-emerald-400 transform hover:scale-110 transition-transform duration-300"
                                whileHover={{ scale: 1.2 }}
                            >
                                <Icon size={20} />
                            </motion.a>
                        ))}
                    </div>
                </div>

                {/* Contact and Newsletter Section */}
                <div className="flex flex-col items-center sm:items-start">
                    <h3 className="font-semibold text-gray-200 text-lg">Head Office</h3>
                    <p className="text-gray-400 text-center sm:text-left">123 Health Street, New York, USA</p>

                    <h3 className="font-semibold text-gray-200 text-lg mt-6">Newsletter</h3>
                    <div className="flex mt-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="p-3 border-b border-gray-400 w-60 text-gray-200 bg-transparent focus:outline-none"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="ml-2 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition"
                        >
                            Subscribe
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Footer Bottom Section */}
            <div className="pt-4 text-center text-gray-400 text-sm">
                <p>&copy; 2025 MediHome Channelling. All Rights Reserved.</p>
            </div>
        </motion.footer>
    );
}

export default Footer;
