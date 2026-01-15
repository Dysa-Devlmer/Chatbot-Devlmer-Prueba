'use client'

import { useState, useEffect } from 'react'
import AIStatus from './components/AIStatus'
import AIConfig from './components/AIConfig'

export default function AIPage() {
  const [activeTab, setActiveTab] = useState('status')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de IA</h1>
          <p className="mt-2 text-gray-600">
            Configura y monitorea los proveedores de inteligencia artificial
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('status')}
              className={`${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Estado
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Configuración
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'status' && <AIStatus />}
        {activeTab === 'config' && <AIConfig />}
      </div>
    </div>
  )
}