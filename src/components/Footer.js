import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; 2024 UWealth. All rights reserved.</p>
        <div className="mt-2">
          <a href="#" className="text-blue-400 hover:text-blue-300 mx-2">Terms of Service</a>
          <a href="#" className="text-blue-400 hover:text-blue-300 mx-2">Privacy Policy</a>
          <a href="#" className="text-blue-400 hover:text-blue-300 mx-2">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;