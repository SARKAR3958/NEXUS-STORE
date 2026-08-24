import re
with open("src/pages/Profile.tsx", "r") as f:
    content = f.read()

target = """              <div className="mt-6 mb-10">
                <Button 
                  onClick={() => setSelectedTransactionReceipt(selectedMobileOrder.paymentProof)}
                  className="w-full bg-[#5c44e4] hover:bg-[#4a34c4] text-white font-extrabold py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(92,68,228,0.3)] text-[13px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>VIEW TRANSACTION RECEIPT</span>
                </Button>
              </div>"""

replacement = """              {selectedMobileOrder.paymentProof ? (
                <div className="mt-6 mb-10">
                  <Button 
                    onClick={() => setSelectedTransactionReceipt(selectedMobileOrder.paymentProof)}
                    className="w-full bg-[#5c44e4] hover:bg-[#4a34c4] text-white font-extrabold py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(92,68,228,0.3)] text-[13px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>VIEW TRANSACTION RECEIPT</span>
                  </Button>
                </div>
              ) : (
                <div className="mt-6 mb-10">
                  <div className="w-full bg-[#151624] text-gray-500 font-extrabold py-4 rounded-xl text-[13px] flex items-center justify-center gap-2 cursor-not-allowed border border-[#262942]">
                    <FileText className="w-4 h-4" />
                    <span>NO RECEIPT AVAILABLE</span>
                  </div>
                </div>
              )}"""

content = content.replace(target, replacement)

with open("src/pages/Profile.tsx", "w") as f:
    f.write(content)
