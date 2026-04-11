import MyFooter from "../components/footer";

export default function UhrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <main>{children}</main>
      <footer><MyFooter /></footer>
    </div>
  );
}
