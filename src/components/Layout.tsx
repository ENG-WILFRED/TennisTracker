import React from 'react';
import Head from 'next/head';
import NavControls from './NavControls';
import ToastProvider from './ToastProvider';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ToastProvider>
        <div className="min-h-screen flex flex-col app-bg">
            <Head>
                <title>Vico - Sports Management Platform</title>
                <meta name="description" content="Manage your sports matches, teams, and competitions on Vico" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
                 <header className="bg-white/90 shadow p-4 flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <h1 className="text-xl font-bold text-green-800">Vico Dashboard</h1>
                      <span className="text-sm text-gray-600">Sports Management</span>
                    </div>
                    <nav className="flex items-center gap-6">
                        <ul className="flex gap-4">
                            <li><a className="text-green-700 hover:underline" href="/">Home</a></li>
                            <li><a className="text-green-700 hover:underline" href="/matches">Matches</a></li>
                            <li><a className="text-green-700 hover:underline" href="/players">Players</a></li>
                            <li><a className="text-green-700 hover:underline" href="/dashboard">Dashboard</a></li>
                            <li><a className="text-green-700 hover:underline" href="/inventory">Inventory</a></li>
                            <li><a className="text-green-700 hover:underline" href="/staff">Staff</a></li>
                            <li><a className="text-green-700 hover:underline" href="/staff/manage">Manage Staff</a></li>
                            <li><a className="text-green-700 hover:underline" href="/coaches">Coaches</a></li>
                        </ul>
                        <NavControls />
                    </nav>
                </header>
            <main className="flex-1 w-full px-4 py-6 max-w-full">{children}</main>
                <footer className="text-center py-4 mt-auto text-sm text-gray-600">
                    <p>&copy; {new Date().getFullYear()} Vico</p>
                </footer>
        </div>
        </ToastProvider>
    );
};

export default Layout;