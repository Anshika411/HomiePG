import "../index.css";
import "../App.css";

export const metadata = {
  title: "HomiePG - Super Admin Portal",
  description: "Platform operator console for managing global state and PG buildings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
