#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/prepare-wordbank-preview.cjs "${1:-../data/VOCABULARY BANK_Old/A1/lingoiq_a1_vocabulary_batch_001.json}"
node node_modules/tailwindcss/lib/cli.js --config scripts/wordbank-preview/tailwind.cjs --input scripts/wordbank-preview/base.css --output .expo/wordbank-preview/style.css --minify
npm exec --yes --package=esbuild@0.25.12 -- esbuild scripts/wordbank-preview/entry.tsx --bundle --outfile=.expo/wordbank-preview/app.js --platform=browser --format=iife --jsx=automatic --main-fields=main --resolve-extensions=.web.js,.web.tsx,.web.ts,.tsx,.ts,.js,.jsx,.json --alias:react-native=./scripts/wordbank-preview/native.tsx --alias:react-native-svg=./node_modules/react-native-svg/lib/module/ReactNativeSVG.web.js --alias:lucide-react-native=./scripts/wordbank-preview/icons.js --alias:@/components/figma/FigmaSvg=./scripts/wordbank-preview/figma.tsx --alias:@/components/lesson/sky-lesson-header=./scripts/wordbank-preview/sky.tsx --loader:.png=file --loader:.webp=file --loader:.svg=file '--asset-names=assets/[name]-[hash]' '--define:process.env.NODE_ENV="development"'
