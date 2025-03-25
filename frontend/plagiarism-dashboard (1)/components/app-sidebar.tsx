"use client"

import { FileText, Moon, Sun, FileCheck, AlertTriangle, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AppSidebarProps {
  activePage: "plagiarism" | "fake-data"
}

export function AppSidebar({ activePage }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Team Meeseeks</span>
                <span className="text-xs text-muted-foreground">Plagiarism checker</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild={false} isActive={activePage === "plagiarism"} onClick={() => router.push("/")}>
              <FileText className="h-4 w-4" />
              <span>Plagiarism Checker</span>
              
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild={false}
              isActive={activePage === "fake-data"}
              onClick={() => router.push("/fake-data")}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Fake Data Detection</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4" />
                <span>Documentation</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback>TM</AvatarFallback>
              </Avatar>
              <span>Team Meeseeks</span>
              <Badge variant="outline" className="ml-auto py-0 h-5">
                Admin
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

