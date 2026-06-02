export type MagicDay = {
  day: number
  title: string
  subtitle: string
  instruction: string
  practicePrompt: string
  extraInputs?: {
    label: string
    placeholder: string
    key: string
    type: 'text' | 'textarea'
  }[]
}

export const MAGIC_DAYS: MagicDay[] = [
  {
    day: 1,
    title: "Cảm nhận Hạnh phúc",
    subtitle: "Count Your Blessings",
    instruction: "Viết ra danh sách 10 điều bạn cảm thấy biết ơn trong cuộc sống. Hãy viết lý do tại sao bạn biết ơn điều đó. Sau khi hoàn thành, hãy đọc lại danh sách (đọc nhẩm hoặc đọc to) và nói từ nhiệm màu: 'Cảm ơn, cảm ơn, cảm ơn' với mỗi điều.",
    practicePrompt: "Liệt kê 10 điều bạn biết ơn hôm nay (ví dụ: gia đình, công việc, sức khỏe, một người bạn...)"
  },
  {
    day: 2,
    title: "Hòn đá Nhiệm màu",
    subtitle: "The Magic Stone",
    instruction: "Tìm một hòn đá nhỏ vừa tay. Trước khi đi ngủ tối nay, hãy cầm hòn đá nhiệm màu trong tay và nghĩ về điều TỐT ĐẸP NHẤT đã xảy ra trong ngày hôm nay. Hãy nói từ nhiệm màu 'Cảm ơn' đối với điều tốt đẹp nhất đó.",
    practicePrompt: "Viết ra điều tốt đẹp nhất đã xảy ra với bạn hôm nay và cảm nhận sự biết ơn sâu sắc.",
  },
  {
    day: 3,
    title: "Mối quan hệ Nhiệm màu",
    subtitle: "Magical Relationships",
    instruction: "Chọn 3 mối quan hệ thân thiết nhất (bố mẹ, vợ chồng, con cái, bạn bè, đồng nghiệp...). Viết ra 5 điều bạn cảm thấy biết ơn nhất về từng người đó, kèm theo bức ảnh của họ trước mặt bạn.",
    practicePrompt: "Chọn 3 người thân thiết nhất và ghi nhận điều bạn biết ơn về họ.",
    extraInputs: [
      {
        key: "relationships_note",
        label: "Ghi chú về 3 người bạn chọn và 5 điều biết ơn mỗi người",
        placeholder: "Ví dụ:\n- Mẹ: Biết ơn vì mẹ luôn lắng nghe và kiên nhẫn...\n- Bạn Nam: Biết ơn vì luôn đồng hành trong công việc...",
        type: "textarea"
      }
    ]
  },
  {
    day: 4,
    title: "Sức khỏe Nhiệm màu",
    subtitle: "Magical Health",
    instruction: "Nghĩ về sức khỏe và các cơ quan trên cơ thể bạn (đôi mắt giúp bạn nhìn, đôi chân giúp bạn đi, trái tim đập không ngừng nghỉ...). Viết lên một tờ giấy dòng chữ: 'Món quà sức khỏe đang giúp tôi tồn tại' và mang theo nó bên mình ngày hôm nay.",
    practicePrompt: "Hãy bày tỏ lòng biết ơn sâu sắc đối với cơ thể và sức khỏe đang có của bạn.",
  },
  {
    day: 5,
    title: "Tiền bạc Nhiệm màu",
    subtitle: "Magic Money",
    instruction: "Ngồi xuống và nghĩ về tuổi thơ của bạn, tất cả những thứ bạn được nhận miễn phí (thức ăn, quần áo, học hành, nhà ở...). Nghĩ về số tiền bạn đã nhận được trong quá khứ và nói cảm ơn sâu sắc. Viết lên một tờ giấy: 'Cảm ơn tất cả số tiền tôi đã nhận được trong cuộc sống'.",
    practicePrompt: "Ghi lại những ký ức tuổi thơ nơi bạn nhận được tiền bạc/vật chất từ người thân và gửi lời cảm ơn.",
  },
  {
    day: 6,
    title: "Công việc Nhiệm màu",
    subtitle: "Works like Magic",
    instruction: "Hôm nay, khi làm việc, hãy tưởng tượng có một người quản lý vô hình đi sau bạn và ghi chép lại mỗi khi bạn tìm thấy điều gì đó để biết ơn trong công việc. Hãy tìm càng nhiều lý do để biết ơn công việc hiện tại càng tốt.",
    practicePrompt: "Ghi lại những điều bạn biết ơn trong công việc hàng ngày của bạn.",
  },
  {
    day: 7,
    title: "Thoát khỏi Sự tiêu cực",
    subtitle: "The Magical Way Out of Negativity",
    instruction: "Chọn một vấn đề tiêu cực trong cuộc sống của bạn mà bạn muốn giải quyết nhất. Viết ra danh sách 10 điều bạn cảm thấy biết ơn về tình huống tiêu cực đó (tìm kiếm những mặt tích cực ẩn giấu). Cuối danh sách, hãy viết: 'Cảm ơn, cảm ơn, cảm ơn vì đã cho tôi thấy giải pháp hoàn hảo'.",
    practicePrompt: "Viết ra tình huống tiêu cực và 10 khía cạnh tích cực bạn tìm thấy từ nó.",
  },
  {
    day: 8,
    title: "Gia vị Nhiệm màu",
    subtitle: "The Magic Ingredient",
    instruction: "Trước khi ăn hoặc uống bất cứ thứ gì hôm nay (dù là bữa chính hay bữa phụ), hãy nhìn vào món ăn đó và nói thầm hoặc nói to từ nhiệm màu: 'Cảm ơn!' và cảm nhận lòng biết ơn đối với thực phẩm và nguồn nước.",
    practicePrompt: "Hôm nay bạn đã thực hành biết ơn món ăn/thức uống nào? Ghi lại cảm nhận của bạn.",
  },
  {
    day: 9,
    title: "Nam châm Tiền bạc",
    subtitle: "The Money Magnet",
    instruction: "Lấy ra các hóa đơn chưa thanh toán, dùng sức mạnh nhiệm màu của lòng biết ơn bằng cách viết lên đó: 'Cảm ơn vì số tiền'. Đối với các hóa đơn đã thanh toán, hãy viết: 'Cảm ơn - Đã thanh toán'. Cảm nhận sự biết ơn vì bạn đã có tiền để chi trả.",
    practicePrompt: "Ghi lại danh sách các hóa đơn bạn đã cảm ơn hôm nay.",
  },
  {
    day: 10,
    title: "Bụi phép thuật cho mọi người",
    subtitle: "Magic Dust Everyone",
    instruction: "Hôm nay, hãy rắc bụi phép thuật lên 10 người - những người đã phục vụ bạn bằng cách này hay cách khác (như nhân viên dọn dẹp, nhân viên bán hàng, shipper, đồng nghiệp...). Hãy nói cảm ơn trực tiếp hoặc âm thầm biết ơn họ.",
    practicePrompt: "Liệt kê 10 người bạn đã rắc bụi phép thuật biết ơn lên họ hôm nay.",
  },
  {
    day: 11,
    title: "Buổi sáng Nhiệm màu",
    subtitle: "A Magic Morning",
    instruction: "Ngay khi thức dậy và đặt chân xuống đất, trước khi làm bất cứ điều gì, hãy nói từ nhiệm màu 'Cảm ơn'. Hãy cảm nhận lòng biết ơn ngập tràn trong từng bước đi vệ sinh, rửa mặt, chuẩn bị đồ ăn sáng.",
    practicePrompt: "Ghi lại cảm nhận về buổi sáng nhiệm màu hôm nay của bạn.",
  },
  {
    day: 12,
    title: "Người thay đổi cuộc đời bạn",
    subtitle: "Magical People Who Made a Difference",
    instruction: "Hôm nay, hãy tìm một nơi yên tĩnh. Nghĩ về 3 người đã từng giúp đỡ hoặc thay đổi cuộc sống của bạn theo hướng tích cực. Hãy nói to hoặc viết một bức thư cảm ơn gửi đến từng người, giải thích rõ họ đã giúp bạn như thế nào.",
    practicePrompt: "Viết lời cảm ơn gửi đến 3 người đặc biệt đã thay đổi cuộc đời bạn.",
  },
  {
    day: 13,
    title: "Thực hiện hóa Mong muốn",
    subtitle: "Make All Your Wishes Come True",
    instruction: "Viết ra danh sách 10 mong muốn lớn nhất của bạn. Đọc lại danh sách đó và dùng trí tưởng tượng của bạn để hình dung rằng mong muốn đó đã thành hiện thực, cảm nhận lòng biết ơn lớn nhất có thể.",
    practicePrompt: "Liệt kê 10 mong muốn lớn nhất của bạn lúc này.",
  },
  {
    day: 14,
    title: "Một ngày Nhiệm màu",
    subtitle: "Have a Magical Day",
    instruction: "Vào buổi sáng, hãy nhắm mắt và nghĩ về các kế hoạch trong ngày (sáng, trưa, chiều, tối). Nói cảm ơn đối với mỗi kế hoạch vì nó đã diễn ra cực kỳ suôn sẻ và tốt đẹp ngoài mong đợi.",
    practicePrompt: "Ghi lại ngày hôm nay đã diễn ra suôn sẻ như thế nào nhờ lòng biết ơn từ sáng sớm.",
  },
  {
    day: 15,
    title: "Cải thiện Mối quan hệ",
    subtitle: "Magically Heal Your Relationships",
    instruction: "Chọn một mối quan hệ đang gặp khó khăn, rạn nứt hoặc bất hòa. Ngồi xuống và viết ra danh sách 10 điều bạn cảm thấy biết ơn về người đó (nghĩ về những khoảng thời gian tốt đẹp trong quá khứ hoặc những điểm tốt của họ).",
    practicePrompt: "Viết ra 10 điều biết ơn đối với người mà bạn muốn hàn gắn mối quan hệ.",
  },
  {
    day: 16,
    title: "Phép màu của Sức khỏe",
    subtitle: "Magic and Miracles in Health",
    instruction: "Nghĩ về sức khỏe trong quá khứ (khi bạn tràn đầy năng lượng), hiện tại (những bộ phận đang khỏe mạnh) và tương lai (chọn một bộ phận bạn muốn cải thiện và biết ơn nó như thể nó đã hoàn toàn khỏe mạnh).",
    practicePrompt: "Gửi lời biết ơn đến sức khỏe quá khứ, hiện tại và tương lai của bạn.",
  },
  {
    day: 17,
    title: "Tấm séc Nhiệm màu",
    subtitle: "The Magic Cheque",
    instruction: "In hoặc vẽ một Tấm séc Nhiệm màu từ Vũ trụ. Điền tên bạn, số tiền bạn đang cần cho một mục tiêu cụ thể, và ngày tháng. Cầm tấm séc trong tay, hình dung bạn đang dùng số tiền đó để mua thứ bạn cần và cảm ơn.",
    practicePrompt: "Viết số tiền bạn ghi trên tấm séc và mục đích bạn sẽ sử dụng số tiền đó.",
  },
  {
    day: 18,
    title: "Danh sách việc cần làm Nhiệm màu",
    subtitle: "The Magical To-Do List",
    instruction: "Viết ra danh sách những việc quan trọng nhất bạn cần thực hiện hôm nay. Chọn ra 3 việc lớn nhất và hình dung rằng chúng đã được giải quyết một cách hoàn hảo bởi Vũ trụ. Hãy cảm nhận lòng biết ơn sâu sắc.",
    practicePrompt: "Viết ra 3 việc lớn đã được giải quyết suôn sẻ hôm nay.",
  },
  {
    day: 19,
    title: "Bước chân Nhiệm màu",
    subtitle: "Magic Footsteps",
    instruction: "Hôm nay, hãy thực hiện 100 bước chân nhiệm màu. Cứ mỗi khi một bàn chân chạm đất, hãy nói từ nhiệm màu 'Cảm ơn' trong tâm trí. Cảm nhận sức mạnh của lòng biết ơn thay đổi năng lượng của bạn.",
    practicePrompt: "Hôm nay bạn đã thực hành 100 bước chân nhiệm màu chưa? Chia sẻ cảm giác của bạn sau khi đi.",
  },
  {
    day: 20,
    title: "Phép màu của Trái tim",
    subtitle: "Heart Magic",
    instruction: "Tập trung sự chú ý của bạn vào vùng ngực (trái tim). Nhắm mắt lại, tiếp tục tập trung vào tim và nói từ nhiệm màu 'Cảm ơn'. Khi làm như vậy, lòng biết ơn sẽ đi thẳng vào tim và mạnh mẽ gấp nhiều lần.",
    practicePrompt: "Chia sẻ trải nghiệm của bạn khi tập trung biết ơn từ sâu thẳm trái tim.",
  },
  {
    day: 21,
    title: "Kết quả Tuyệt diệu",
    subtitle: "Magnificent Outcomes",
    instruction: "Trước khi thực hiện 3 công việc quan trọng hôm nay (ví dụ: một cuộc họp, một cuộc điện thoại, lái xe đi làm...), hãy nhắm mắt lại và nói: 'Cảm ơn vì kết quả tuyệt diệu!'. Cảm nhận sự an tâm vì mọi việc đã được định sẵn tốt đẹp.",
    practicePrompt: "Liệt kê 3 việc bạn đã áp dụng phép màu Kết quả Tuyệt diệu hôm nay.",
  },
  {
    day: 22,
    title: "Phép màu ngay trước mắt",
    subtitle: "Before Your Very Eyes",
    instruction: "Lấy lại danh sách 10 mong muốn bạn đã viết ở Ngày 13. Đọc qua danh sách đó ít nhất 2 lần trong ngày hôm nay. Mỗi lần, hãy hình dung mong muốn đó đã thành hiện thực và cảm nhận lòng biết ơn tối đa.",
    practicePrompt: "Hôm nay bạn đã đọc lại danh sách mong muốn chưa? Cảm xúc của bạn thế nào?",
  },
  {
    day: 23,
    title: "Dòng khí Nhiệm màu bạn thở",
    subtitle: "The Magical Air That You Breathe",
    instruction: "Hôm nay, hãy dừng lại 5 lần trong ngày, hít thở thật sâu 5 lần và cảm nhận luồng không khí đi vào cơ thể bạn. Sau khi hít thở, hãy nói từ nhiệm màu: 'Cảm ơn dòng khí nhiệm màu tôi đang thở'.",
    practicePrompt: "Ghi lại cảm nhận sự sống thông qua hơi thở sâu của bạn hôm nay.",
  },
  {
    day: 24,
    title: "Chiếc đũa phép",
    subtitle: "The Magic Wand",
    instruction: "Chọn 3 người bạn yêu quý đang gặp khó khăn về sức khỏe, tài chính hoặc đang không hạnh phúc. Hình dung sức khỏe/sự sung túc/hạnh phúc của họ đã được phục hồi hoàn hảo. Cầm ảnh của họ (nếu có) và nói: 'Cảm ơn vì sức khỏe/tài chính/hạnh phúc của [Tên]'.",
    practicePrompt: "Chọn 3 người bạn muốn hướng chiếc đũa phép biết ơn đến họ hôm nay.",
  },
  {
    day: 25,
    title: "Gợi ý Nhiệm màu",
    subtitle: "Cue The Magic",
    instruction: "Hôm nay, hãy nhạy cảm với các gợi ý từ Vũ trụ. Ví dụ: thấy người đi bộ tập thể dục -> gợi ý biết ơn sức khỏe; thấy còi xe cảnh sát -> gợi ý biết ơn sự an toàn; thấy người khác cười -> gợi ý biết ơn niềm vui. Tìm ít nhất 7 gợi ý hôm nay.",
    practicePrompt: "Liệt kê các gợi ý từ Vũ trụ bạn đã nhận ra và biết ơn hôm nay.",
  },
  {
    day: 26,
    title: "Biến lỗi lầm thành Hạnh phúc",
    subtitle: "Magically Transform Mistakes into Blessings",
    instruction: "Chọn một lỗi lầm bạn đã mắc phải trong đời. Tìm kiếm và viết ra danh sách 10 điều bạn cảm thấy biết ơn nhờ lỗi lầm đó (bài học kinh nghiệm, sự trưởng thành, những người bạn gặp...).",
    practicePrompt: "Viết ra lỗi lầm đã chọn và 10 điều biết ơn rút ra từ nó.",
  },
  {
    day: 27,
    title: "Tấm gương Nhiệm màu",
    subtitle: "The Magic Mirror",
    instruction: "Mỗi khi nhìn vào gương hôm nay, hãy nhìn thẳng vào mắt mình và nói từ nhiệm màu: 'Cảm ơn'. Hãy cảm nhận lòng biết ơn chân thành nhất đối với chính bản thân bạn, sự tồn tại của bạn.",
    practicePrompt: "Ghi lại lời tự tình biết ơn gửi đến chính bản thân bạn sau khi đứng trước gương.",
  },
  {
    day: 28,
    title: "Nghiệm lại Phép màu",
    subtitle: "Remember The Magic",
    instruction: "Đây là bài tập cuối cùng. Hãy nhớ lại ngày hôm qua từ sáng đến tối, tìm kiếm những điều may mắn và viết chúng ra. Tự hỏi mình: 'Những điều tốt đẹp nào đã xảy ra ngày hôm qua?'. Hãy nói cảm ơn với mỗi điều đó.",
    practicePrompt: "Liệt kê các điều may mắn đã xảy ra với bạn trong ngày hôm qua."
  }
]
