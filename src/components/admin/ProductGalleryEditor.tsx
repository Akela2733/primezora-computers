"use client";

import ImageUpload from "@/components/admin/ImageUpload";

type ProductGalleryEditorProps = {
  images: string[];
  onChange: (
    images: string[] | ((current: string[]) => string[])
  ) => void;
};

export default function ProductGalleryEditor({
  images,
  onChange,
}: ProductGalleryEditorProps) {
  const addImage = () => onChange((current) => [...current, ""]);
  const updateImage = (index: number, image: string) => {
    onChange((current) =>
      current.map((currentImage, currentIndex) =>
        currentIndex === index ? image : currentImage
      )
    );
  };
  const removeImage = (index: number) =>
    onChange((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );

  return (
    <section className="mt-6 border-t border-white/[0.07] pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xs font-bold uppercase text-white/80">
            Product Gallery
          </h3>
          <p className="mt-1 text-[10px] leading-5 text-white/35">
            Upload additional product photos shown in the product gallery.
          </p>
        </div>
        <button
          type="button"
          onClick={addImage}
          disabled={images.length >= 20}
          className="shrink-0 border border-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white/60 transition hover:border-amber-600/50 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add Image
        </button>
      </div>

      {images.length > 0 ? (
        <div className="space-y-5">
          {images.map((image, index) => (
            <div
              key={`gallery-${index}`}
              className="border border-white/[0.06] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">
                  Gallery Image {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-[9px] font-bold uppercase tracking-wider text-red-300/70 transition hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <ImageUpload
                label={`Gallery Image ${index + 1}`}
                value={image}
                onChange={(value) => updateImage(index, value)}
                allowUrlEntry={false}
                previewDescription="Additional product gallery image."
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-white/10 px-4 py-5 text-center text-[10px] text-white/30">
          No additional gallery images.
        </p>
      )}
    </section>
  );
}
