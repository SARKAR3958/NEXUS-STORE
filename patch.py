import re
with open("src/pages/Profile.tsx", "r") as f:
    content = f.read()

target = re.search(r"const isReceiptExpanded = expandedOrderId === order\._id;[\s\S]*?</AnimatePresence>\s*</div>\s*\);\s*}\)\}\s*</div>", content)
if target:
    start_idx = target.start()
    end_idx = target.end()
    
    replacement = """
                          return (
                            <div key={order._id} className="bg-[#0b0c13] border border-[#202234] rounded-[20px] p-4 text-xs relative overflow-hidden shadow-md text-left transition-all">
                              <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => setSelectedMobileOrder(order)}>
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden shrink-0 bg-[#151624] border border-[#262942]">
                                    {order.products[0]?.image ? (
                                      <img src={order.products[0].image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#a78bfa]">
                                        <Package className="w-6 h-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0 text-left justify-center py-0.5">
                                    <span className="text-[11px] text-gray-500 font-mono font-bold tracking-widest uppercase mb-1">ORDER ID: #NEX-{order._id.slice(0, 7).toUpperCase()}</span>
                                    <span className="font-extrabold text-white truncate text-[14px]">{order.products[0]?.title || "Digital Asset"}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 justify-center py-0.5">
                                  <span className="text-[#c084fc] font-black text-[14px] mb-1">${order.totalAmount.toFixed(2)}</span>
                                  <span className={`text-[12px] font-black tracking-wide ${
                                    isApproved ? 'text-emerald-400' : isPending ? 'text-[#ffb000]' : 'text-red-400'
                                  }`}>
                                    {isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>"""
    
    content = content[:start_idx] + replacement.lstrip() + content[end_idx:]
    with open("src/pages/Profile.tsx", "w") as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found")
