import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Configuración vacía de Turbopack para silenciar el warning
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignorar archivos problemáticos de libsql
      config.externals = [...(config.externals || []), '@libsql/isomorphic-ws'];
    }

    return config;
  },
};

export default nextConfig;
