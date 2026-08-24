import re
with open("src/pages/Profile.tsx", "r") as f:
    content = f.read()

content = content.replace(
"""export interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string | Date | any;
  products: OrderProduct[];
}""",
"""export interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string | Date | any;
  products: OrderProduct[];
  paymentProof?: string | null;
}"""
)

with open("src/pages/Profile.tsx", "w") as f:
    f.write(content)
