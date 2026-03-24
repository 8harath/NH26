import Image from 'next/image'

export function Logo({ size = 'default', dark = false }: { size?: 'sm' | 'default' | 'lg'; dark?: boolean }) {
  const config = {
    sm: { img: 28, text: 'text-base' },
    default: { img: 36, text: 'text-xl' },
    lg: { img: 48, text: 'text-2xl' },
  }[size]

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/android-chrome-192x192.png"
        alt="MailMate"
        width={config.img}
        height={config.img}
        className={`object-contain ${dark ? 'invert' : ''}`}
      />
      <span className={`${config.text} font-display tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
        <span className="font-black">M</span>ail<span className="font-black">M</span>ate
      </span>
    </div>
  )
}
