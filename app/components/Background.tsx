import Image from "next/image";

export default function Background() {
    return (
        <div className="fixed inset-0 -z-10">
            <Image
                src="/ae_desktop.jpg"
                alt=""
                fill
                preload
                sizes="100vw"
                className="object-cover object-[center_40%]"
            />
            <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />
        </div>
    );
}
