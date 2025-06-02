'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Bell, User, LogOut, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6">
      {/* Menu mobile e Breadcrumb */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <a 
          href="/dashboard"
          className="text-sm font-medium text-gray-600 hover:text-[#08285d] hover:underline transition-colors duration-200 cursor-pointer flex items-center"
        >
          Dashboard
        </a>
      </div>

      {/* Ações do usuário */}
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-[#08285d] rounded-full overflow-hidden flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline text-sm font-medium text-gray-700">Admin</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              <a 
                href="/dashboard/meu-perfil" 
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <User className="w-4 h-4 mr-2 text-gray-500" />
                Meu Perfil
              </a>
              <button 
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
