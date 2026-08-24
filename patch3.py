import re
with open("src/pages/Profile.tsx", "r") as f:
    content = f.read()

target = re.search(r"fetchedOrders\.push\(\{\s*_id: docSnap\.id,\s*totalAmount: data\.totalAmount \|\| 0,\s*status: data\.status \|\| \"pending\",\s*createdAt: [^\n]+,\s*products: productsList\s*\}\);", content)

if target:
    start_idx = target.start()
    end_idx = target.end()
    
    replacement = """
            fetchedOrders.push({
              _id: docSnap.id,
              totalAmount: data.totalAmount || 0,
              status: data.status || "pending",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
              products: productsList,
              paymentProof: data.paymentProof || data.screenshotProof || data.screenshotUrl || data.depositProof || null
            });"""
    
    content = content[:start_idx] + replacement.lstrip() + content[end_idx:]
    with open("src/pages/Profile.tsx", "w") as f:
        f.write(content)
    print("Replaced fetchedOrders.push successfully")
else:
    print("Target not found")
