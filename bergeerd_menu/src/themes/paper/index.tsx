import { useCallback, useLayoutEffect, useState } from "react";
import "@fontsource/lalezar/400.css";
import "./paper.css";
import type { MenuItem, ThemeProps } from "@/core/types";
import Masthead from "./Masthead";
import CategoryBar from "./CategoryBar";
import MenuSections from "./MenuSections";
import ItemSheet from "./ItemSheet";
import VisitSection from "./VisitSection";
import Footer from "./Footer";

/**
 * Paper: a light, printed-menu design. Mobile first (most visitors arrive by
 * scanning a QR code): awning masthead, sticky category bar, a receipt-like
 * menu with a detail sheet per dish, then contact details.
 */
const PaperTheme = ({ menu }: ThemeProps) => {
  const { branch, sections } = menu;
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const closeItem = useCallback(() => setOpenItem(null), []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = "paper";
    return () => {
      delete root.dataset.theme;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Masthead branch={branch} sections={sections} />
      {sections.length > 0 ? (
        <>
          <CategoryBar sections={sections} />
          <MenuSections sections={sections} onOpen={setOpenItem} />
        </>
      ) : (
        <p className="paper-display mx-auto max-w-md px-6 py-20 text-center text-3xl text-muted-foreground">
          منوی این شعبه به‌زودی اینجاست
        </p>
      )}
      <VisitSection branch={branch} />
      <Footer branch={branch} />
      {openItem && <ItemSheet item={openItem} onClose={closeItem} />}
    </div>
  );
};

export default PaperTheme;
