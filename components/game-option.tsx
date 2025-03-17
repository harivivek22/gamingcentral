import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface GameOptionProps {
  title: string
  description: string
  href: string
  bgColor: string
  hoverColor: string
  textColor: string
  hoverTextColor: string
}

export function GameOption({
  title,
  description,
  href,
  bgColor,
  hoverColor,
  textColor,
  hoverTextColor,
}: GameOptionProps) {
  return (
    <Link href={href} className={`transition-transform hover:scale-105 ${hoverColor} ${hoverTextColor}`}>
      <Card className={`h-full border-white ${bgColor} ${textColor}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-current">{title}</CardTitle>
          <CardDescription className="text-current opacity-80">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

