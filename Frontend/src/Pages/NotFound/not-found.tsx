import { Link } from "react-router-dom";
 
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
      
      {/* 404 text (slightly above image) */}
      <h1 className="text-7xl font-light text-black mt-15 z-10 [font-family:var(--font-heading)]">
        404
      </h1>

      {/* Image */}
      <img
        src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
        alt="404 illustration"
        className="h-[460px] mb-8 z-0 fixed"
      />

      {/* Bottom content */}
      <h2 className="text-4xl font-bold text-black mt-60 mb-3 z-10 [font-family:var(--font-heading)]">
        Look like you're lost
      </h2>

      <p className="text-lg text-black mb-8 z-10 [font-family:var(--font-heading)]">
        The page you are looking for is not available!
      </p>
      <Link to="/HomePage">
      <button
        onClick={() => window.location.href = "/"}
        className="bg-green-600 hover:bg-green-700 hover:text-white text-black px-3 py-2 rounded-lg text-xs cursor-pointer"
      >
        Go to Home
      </button>
      </Link>

    </div>
  );
}
