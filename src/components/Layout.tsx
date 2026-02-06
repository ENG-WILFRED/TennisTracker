import React from 'react';
import Head from 'next/head';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>Tennis Matches App</title>
                <meta name="description" content="Manage tennis matches and players" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
                 <header className="bg-white shadow p-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">Tennis Matches</h1>
                    <nav>
                        <ul className="flex gap-4">
                            <li><a className="text-blue-600 hover:underline" href="/">Home</a></li>
                            <li><a className="text-blue-600 hover:underline" href="/matches">Matches</a></li>
                            <li><a className="text-blue-600 hover:underline" href="/players">Players</a></li>
                        </ul>
                    </nav>
                </header>
            <main>{children}</main>
                <footer className="text-center py-4 mt-auto text-sm text-gray-600">
                    <p>&copy; {new Date().getFullYear()} Tennis Matches App</p>
                </footer>
        </div>
    );
};

export default Layout;