export default function PrivacyPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <p className="font-semibold text-gray-800">
          TL;DR: Only your name, email, and profile avatar are used by the app. Data is stored in encrypted storage, will not be shared with 3rd parties, and users can request deletion at any time which will be processed immediately.
        </p>
      </div>

      <h2 className="text-xl font-bold mt-6 mb-3">Data Accessed</h2>
      <p className="mb-4 text-gray-700">The specific types of Google user data our application accesses are your Name, Email address, and Profile Avatar.</p>

      <h2 className="text-xl font-bold mt-6 mb-3">Data Usage</h2>
      <p className="mb-4 text-gray-700">The application uses this data solely to provide you with access to our services, for authentication, and for user identification within the app. Your profile avatar and name are displayed within the application to represent your user account.</p>

      <h2 className="text-xl font-bold mt-6 mb-3">Data Sharing</h2>
      <p className="mb-4 text-gray-700">Google user data is <strong>never</strong> shared with any third parties. It remains strictly internal to this application.</p>

      <h2 className="text-xl font-bold mt-6 mb-3">Data Storage & Protection</h2>
      <p className="mb-4 text-gray-700">All user data is stored in encrypted storage. We implement robust security practices to protect your data from unauthorized access, alteration, disclosure, or destruction.</p>

      <h2 className="text-xl font-bold mt-6 mb-3">Data Retention & Deletion</h2>
      <p className="mb-4 text-gray-700">Data is retained only as long as your account is active. Users can request the deletion of their data at any time. Upon receipt of a deletion request, all associated user data will be deleted immediately from our active databases.</p>
    </div>
  );
}
