"""
CraftIDE Local AI Fine-Tuning Script
Powered by Unsloth & HuggingFace

This script is designed to be run in Google Colab (with a free T4 GPU)
or on your local machine if you have an NVIDIA GPU (RTX 3060 12GB+ or better).

PREREQUISITES:
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
"""

import os
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 1. Konfigürasyon
model_name = "unsloth/Qwen1.5-1.8B-Chat-bnb-4bit" # Küçük ama kodda çok zeki, 4-bit sıkıştırılmış
max_seq_length = 2048 # Maksimum kelime hafızası
dataset_path = "dataset.jsonl" # Az önce ürettiğimiz JSONL dosyası
output_gguf_name = "craftide-ai-1.8b-q4_k_m.gguf"

print("Model Yükleniyor... Bu işlem birkaç dakika sürebilir.")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = model_name,
    max_seq_length = max_seq_length,
    dtype = None,
    load_in_4bit = True, # RAM kullanımını inanılmaz düşürür!
)

# 2. LoRA Ayarları (Sadece modelin %2'sini eğitiyoruz, bu yüzden çok hızlı)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 3. Veri Setini Yükleme (ChatML formatında)
print("Veri Seti Yükleniyor...")
def formatting_prompts_func(example):
    # ChatML formatını Qwen/Llama için optimize et
    messages = example["messages"]
    texts = [tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)]
    return { "text" : texts }

dataset = load_dataset("json", data_files=dataset_path, split="train")
dataset = dataset.map(formatting_prompts_func, batched = True)

# 4. Eğiticiyi (Trainer) Başlatma
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, # Daha stabil eğitim için
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Demo için 60 adım. Gerçek eğitim için 'num_train_epochs = 3' kullanın.
        learning_rate = 2e-4,
        fp16 = not os.environ.get("USE_BFLOAT16", False),
        bf16 = os.environ.get("USE_BFLOAT16", False),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

print("Eğitim Başlıyor! (Minecraft Uzmanı Doğuyor...)")
trainer_stats = trainer.train()

# 5. Modeli GGUF Formatında Dışa Aktar (LM Studio ve CraftIDE için)
print("****************************************")
print(f"Eğitim Tamamlandı! Şimdi modeli GGUF olarak dışa aktarıyoruz: {output_gguf_name}")
print("Bu işlem biraz sürecektir...")

# Quantization metodunu "q4_k_m" seçtik (hız ve zeka dengesi en iyi olanı)
model.save_pretrained_gguf("craftide-ai-finetuned", tokenizer, quantization_method = "q4_k_m")

print("Her Şey Hazır! 'craftide-ai-finetuned' klasöründeki .gguf dosyasını LM Studio'da kullanabilirsiniz!")
