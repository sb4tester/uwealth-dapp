import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white p-8">
      <div className="container mx-auto text-center">
        <p className="text-green-500 font-bold text-xl mb-4">UWealth</p>
        <p>&copy; 2024 UWealth. All rights reserved.</p>
        <div className="mt-4">
          <a href="#" className="text-gray-400 hover:text-green-500 mx-2">Terms of Service</a>
          <a href="#" className="text-gray-400 hover:text-green-500 mx-2">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-green-500 mx-2">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;