using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class TempOrderPointsItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TempOrderPointsId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        public int EligibleProductId { get; set; }

        [Required]
        public int Quantity { get; set; }

        [ForeignKey("TempOrderPointsId")]
        public virtual TempOrderPoints? TempOrderPoints { get; set; }
    }
}
