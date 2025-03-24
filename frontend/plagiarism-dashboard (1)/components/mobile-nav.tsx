"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"

export function MobileNav() {
  const pathname = usePathname()
  const activePage = pathname === "/fake-data" ? "fake-data" : "plagiarism"

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <AppSidebar activePage={activePage} />
      </SheetContent>
    </Sheet>
  )
}

