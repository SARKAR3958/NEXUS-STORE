import re
with open("src/pages/Profile.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0c13] sm:hidden">',
    '<div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0c13] md:bg-black/80 md:backdrop-blur-sm md:items-center md:justify-center md:p-6">'
)

content = content.replace(
    '<div className="flex-1 overflow-y-auto px-4 py-6">',
    '<div className="flex-1 md:flex-none overflow-y-auto px-4 py-6 md:bg-[#0b0c13] md:border md:border-[#202234] md:rounded-[32px] md:w-full md:max-w-xl md:max-h-[90vh] md:shadow-2xl">'
)

with open("src/pages/Profile.tsx", "w") as f:
    f.write(content)
print("Replaced modal")
