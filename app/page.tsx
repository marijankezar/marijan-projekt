import Image from "next/image";
import MyHeder from "./components/header";
import MyMainContent from "./subpages/page-content-main";
import MyFooter from "./components/footer";
import MariaDBInsertData from "./components/insert-daten";
import MariaDBSelectData from "./components/daten-anzeigen";
import PGDBSelectData from "./components/FetchTestTab";
import ConnectionLogger from "./components/ConnectionLogger";
import LogClientVisit from "./components/LogClientVisit";
import StundenbuchungenList from "./components/StundenbuchungenList";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* 🌐 Navigation */}
      <nav className="bg-gray-900 text-white shadow-md">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16 items-center">
      <div className="flex space-x-6 text-sm sm:text-base">
        <Link href="/" className="hover:text-yellow-300 transition-colors">
          Start
        </Link>
        <Link href="/stunden" className="hover:text-yellow-300 transition-colors">
          Stundenbuchungen
        </Link>
        {/* Weitere Links optional */}
      </div>
    </div>
  </div>
</nav>


      {/* 🔽 Bestehender Seiteninhalt */}
      <div>
        <MyHeder />
      </div>
      <div>
        <MyMainContent />
      </div>
      {/* <div><MariaDBInsertData /></div> */}
      {/* <div><MariaDBSelectData /></div> */}
      {/* <div><PGDBSelectData /></div> */}
      {/* <div><ConnectionLogger /></div> */}
      {/* <div><StundenbuchungenList /></div> */}

      <div>
        <MyFooter />
      </div>

      <LogClientVisit />
    </div>
  );
}
