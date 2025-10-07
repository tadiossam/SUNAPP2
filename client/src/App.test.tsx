// Minimal test component to debug the issue
export default function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Test Page</h1>
      <p>If you see this, React is working fine.</p>
      <p>The issue is likely with ThemeProvider or one of the other providers.</p>
    </div>
  );
}
