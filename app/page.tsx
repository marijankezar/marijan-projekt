import Image from "next/image";
import MyHeder from "./components/header";
import MyMainContent from "./subpages/page-content-main";
import MyFooter from "./components/footer";
import LogClientVisit from "./components/LogClientVisit";
import Link from "next/link";
import DönerMenu from "./subpages/samy";

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


// export default function Home() {
//   return (
//     <div>
     
//       <div>
//         <DönerMenu />
//       </div>
    
//     </div>
//   );
// }
