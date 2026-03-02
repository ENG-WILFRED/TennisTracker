"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the list page
        router.replace('/organization/list');
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 text-lg">Loading...</p>
            </div>
        </div>
    );
}