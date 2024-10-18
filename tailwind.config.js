/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
	    extend: {
	      colors: {
	        'primary': 'rgb(var(--color-primary) / <alpha-value>)',
	        'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
	        'background-dark': 'rgb(var(--color-background-dark) / <alpha-value>)',
	        'background-light': 'rgb(var(--color-background-light) / <alpha-value>)',
	        'text': 'rgb(var(--color-text) / <alpha-value>)',
	        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
	      },
	    },
	  },
  plugins: [],
}

