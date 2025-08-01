import Image from "next/image";
import MyHeder from "./components/header";
import MyMainContent from "./subpages/page-content-main";
import MyFooter from "./components/footer";
import LogClientVisit from "./components/LogClientVisit";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div>
        <MyHeder />
      </div>
      <div>
        <MyMainContent />
      </div>
      <div>
        <MyFooter />
      </div>
      <LogClientVisit />
    </div>
  );
}
