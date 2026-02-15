import MyHeder from "./components/header";
import MyMainContent from "./subpages/page-content-main";
import MyFooter from "./components/footer";
import LogClientVisit from "./components/LogClientVisit";

export default function Home() {
  return (
    <div>
      <header>
        <MyHeder />
      </header>
      <main>
        <MyMainContent />
      </main>
      <footer>
        <MyFooter />
      </footer>
      <LogClientVisit />
    </div>
  );
}
